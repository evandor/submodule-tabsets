<template>
  <!-- TabGrid2 -->
  <div class="row">
    <div class="col-2 text-center cursor-pointer" v-for="index in 6">
      {{ columns[index]?.title || '&nbsp;' }}
      <q-popup-edit v-if="columns[index]"
        v-model="columns[index].title" auto-save v-slot="scope">
        <q-input v-model="scope.value" dense autofocus counter
                 @update:model-value="val => setColumn( index, val)"
                 @keyup.enter="scope.set"/>
      </q-popup-edit>
    </div>
  </div>

  <GridLayout :layout.sync="layout"
              :key="randomKey"
              :col-num="12"
              :row-height="rowHeight"
              :is-draggable="draggable"
              :is-resizable="false"
              :vertical-compact="true"
              :use-css-transforms="true">
    <GridItem v-for="item in layout"
              @moved="movedEvent"
              :static="item.static"
              :maxH="2"
              :maxW="2"
              :minW="2"
              :minH="2"
              :x="item.x"
              :y="item.y"
              :w="item.w"
              :h="item.h"
              :i="item.i">
      <TabGridWidget :key="item.tab.id" :tab="item.tab"/>
      <q-menu
        touch-position
        context-menu>
        <q-list dense style="min-width: 100px">
          <q-item clickable v-close-popup @click="toggleFavorite(item.tab)">
            <q-item-section v-if="!item.tab.favorite || item.tab.favorite === TabFavorite.NONE">Make Favorite
            </q-item-section>
            <q-item-section v-if="item.tab.favorite && item.tab.favorite !== TabFavorite.NONE">Remove as Favorite
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="createThumbnail(item.tab)">
            <q-item-section>(re-)create thumbnail</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </GridItem>
  </GridLayout>

</template>

<script setup lang="ts">

// @ts-ignore
import {GridItem, GridLayout} from 'vue-grid-layout-v3';

import {onMounted, onUnmounted, PropType, ref, watchEffect} from "vue";
import {Tab, TabCoordinate, TabFavorite} from "src/tabsets/models/Tab";
import TabGridWidget from "src/tabsets/widgets/TabGridWidget.vue";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import _ from "lodash"
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {ToggleTabFavoriteCommand} from "src/tabsets/commands/ToggleTabFavoriteCommand";
import {Tabset} from "src/tabsets/models/Tabset";
import {uid} from "quasar";
import {useThumbnailsService} from "src/thumbnails/services/ThumbnailsService";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import AppEventDispatcher from "src/app/AppEventDispatcher";
import {TabsetColumn} from "src/tabsets/models/TabsetColumn";

const props = defineProps({
  tabs: {type: Array as PropType<Array<Tab>>, required: true},
  tabset: {type: Object as PropType<Tabset>, required: true},
  coordinatesIdentifier: {type: String, required: true}
})

const emits = defineEmits(['wasClicked'])

const layout = ref<any[]>([])

const draggable = ref(true)
const randomKey = ref<string>(uid())
let windowWidth = ref(window.innerWidth)
const rowHeight = ref(Math.round(window.innerWidth / 44))
const columns = ref<any[]>([{title:'click to add title'},{title:' '},{title:' '},{title:' '},{title:' '},{title:' '}])

const onWidthChange = () => windowWidth.value = window.innerWidth

onMounted(() => {
  window.addEventListener('resize', onWidthChange)
})

onUnmounted(() => window.removeEventListener('resize', onWidthChange))

function getCoordinate(t: Tab, ident: string, def: number) {
  if (!t.coordinates) {
    return def
  }
  const coordinates = _.find(t.coordinates, (c: TabCoordinate) => c.identifier === props.coordinatesIdentifier)
  return coordinates && coordinates.val && (coordinates.val[ident as keyof object] >= 0) ? coordinates.val[ident as keyof object] : def
}

watchEffect(() => {
  _.forEach(props.tabset?.columns, (c: TabsetColumn) => {
    if (c.id.startsWith("grid_")) {
      var index = parseInt(c.id.split("_")[1]!)
      if (index >= 0 && index <= 6) {
        columns.value[index] = {title: c.title}
      }
    }
  })
})

watchEffect(() => {
  //console.log("in:", _.map(props.tabs, (t:Tab) => JSON.stringify({id: t.id, data: t.griddata})))
  layout.value = []
  for (const t of props.tabs) {
    if (!t.coordinates) {
      t.coordinates = []
    }
    const griddata = {
      tab: t,
      x: getCoordinate(t, 'x', 2),
      y: getCoordinate(t, 'y', 0),
      w: getCoordinate(t, 'w', 2),
      h: getCoordinate(t, 'h', 4),
      i: t.id,
      static: false
    }
    // console.log(`===> x=${JSON.stringify(griddata)})`)
    layout.value.push(griddata)
  }
})

watchEffect(() => {
  rowHeight.value = Math.round(windowWidth.value / 44)
  console.log("rowHeight:", windowWidth.value, rowHeight.value)
})

const setColumn = (i:number, v: any) => {
  console.log("setting column", i,v)
  const tsCol = new TabsetColumn("grid_" + i, v)
  columns.value[i].title = tsCol.title
  var newColumns = _.filter(props.tabset?.columns,(c: TabsetColumn) => c.id !== tsCol.id)
  newColumns.push(tsCol)
  props.tabset.columns = newColumns
  useTabsetsStore().saveTabset(props.tabset)
}

const movedEvent = (i: any, newX: any, newY: any) => {
  const msg = "MOVED i=" + i + ", X=" + newX + ", Y=" + newY;
  console.log(msg);
  const tab: Tab | undefined = _.find(props.tabs, (t: Tab) => t.id === i)
  if (tab) {
    if (!tab.coordinates) {
      tab.coordinates = []
    }
    const optionalGriddataIndex = _.findIndex(tab.coordinates, (c: TabCoordinate) => c.identifier === props.coordinatesIdentifier)
    const gd: { [k: string]: any } = (optionalGriddataIndex >= 0)
      ? tab.coordinates.at(optionalGriddataIndex) ? tab.coordinates.at(optionalGriddataIndex)!.val : {}
      : {}
    gd['x'] = newX
    gd['y'] = newY
    if (optionalGriddataIndex < 0) {
      tab.coordinates.push(new TabCoordinate(props.coordinatesIdentifier, gd))
    }
    useTabsetsStore().saveTabset(props.tabset)
  }
}

const toggleFavorite = async (tab: Tab) => {
  await useCommandExecutor().execute(new ToggleTabFavoriteCommand(tab.id))
  randomKey.value = uid()
  emits('wasClicked')
}

const createThumbnail = async (tab: Tab) => {
  if (!tab || !tab.url) {
    return
  }
  const browserTabs = useTabsStore2().getChromeTabs as chrome.tabs.Tab[]
  console.log("checking for url", tab.url)
  const openTab: chrome.tabs.Tab | undefined = _.find(browserTabs, (bt: chrome.tabs.Tab) => bt.url === tab.url)
  const currentTab = await chrome.tabs.getCurrent()
  if (openTab) {
    console.log("found open tab", openTab.id)
    await chrome.tabs.update(openTab.id || 0, {active: true})
    useThumbnailsService().captureVisibleTab(tab.id, (tabId: string, dataUrl: string) => {
      AppEventDispatcher.dispatchEvent('capture-screenshot', {
        tabId: tabId,
        data: dataUrl
      })
      if (currentTab) {
        setTimeout(() => {
          console.log("going back to ", currentTab.id)
          chrome.tabs.update(currentTab.id || 0, {active: true})
            .then(() => chrome.tabs.reload())
        }, 1000)
      }
    })
  } else {
    const newTab: chrome.tabs.Tab = await chrome.tabs.create({url: tab.url})
    console.log("opened new tab...", newTab.id)
    setTimeout(() => {
      useThumbnailsService().captureVisibleTab(tab.id, (tabId: string, dataUrl: string) => {
        AppEventDispatcher.dispatchEvent('capture-screenshot', {
          tabId: tabId,
          data: dataUrl
        })
      })
      setTimeout(() => {
        chrome.tabs.remove(newTab.id || 0)
          .then(() => chrome.tabs.reload())
      }, 1000)
    }, 2000)
  }
}

</script>

<style scoped>
.vue-grid-layout {
  background: white;
}

.vue-grid-item:not(.vue-grid-placeholder) {
  background: #efefef;
  border: 0px solid black;
}

.vue-grid-item .resizing {
  opacity: 0.9;
}

.vue-grid-item .static {
  background: #cce;
}

.vue-grid-item .text {
  font-size: 24px;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 100%;
  width: 100%;
}

.vue-grid-item .no-drag {
  height: 100%;
  width: 100%;
}

.vue-grid-item .minMax {
  font-size: 12px;
}

.vue-grid-item .add {
  cursor: pointer;
}

.vue-draggable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 0;
  left: 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>") no-repeat;
  background-position: bottom right;
  padding: 0 8px 8px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: pointer;
}


</style>
