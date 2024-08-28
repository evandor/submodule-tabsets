<template>

  <GridLayout :layout.sync="layout"
              :key="randomKey"
              :col-num="16"
              :row-height="20"
              :is-draggable="draggable"
              :is-resizable="resizable"
              :vertical-compact="true"
              :use-css-transforms="true">
    <GridItem v-for="item in layout"
              @moved="movedEvent"
              @resized="resizedEvent"
              @container-resized="containerResizedEvent"
              :static="item.static"
              :maxH="8"
              :maxW="8"
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
            <q-item-section v-if="item.tab.favorite === TabFavorite.NONE">Make Favorite</q-item-section>
            <q-item-section v-if="item.tab.favorite !== TabFavorite.NONE">Remove as Favorite</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </GridItem>
  </GridLayout>

</template>

<script setup lang="ts">

import {GridItem, GridLayout} from 'vue-grid-layout-v3';

import {onMounted, PropType, ref} from "vue";
import {Tab, TabCoordinate, TabFavorite} from "src/tabsets/models/Tab";
import TabGridWidget from "src/tabsets/widgets/TabGridWidget.vue";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import _ from "lodash"
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {ToggleTabFavoriteCommand} from "src/tabsets/commands/ToggleTabFavoriteCommand";
import {Tabset} from "src/tabsets/models/Tabset";
import {uid} from "quasar";

const props = defineProps({
  tabs: {type: Array as PropType<Array<Tab>>, required: true},
  tabset: {type: Object as PropType<Tabset>, required: true},
  coordinatesIdentifier: {type: String, required: true}
})

const emits = defineEmits(['wasClicked'])

const layout = ref<any[]>([])

const draggable = ref(true)
const resizable = true
const randomKey = ref<string>(uid())

onMounted(() => {
  function getCoordinate(t: Tab, ident: string, def: number) {
    if (!t.coordinates) {
      return def
    }
    const coordinates = _.find(t.coordinates, (c: TabCoordinate) => c.identifier === props.coordinatesIdentifier)
    return coordinates && coordinates.val && (coordinates.val[ident as keyof object] >= 0) ? coordinates.val[ident as keyof object] : def
  }

  //console.log("in:", _.map(props.tabs, (t:Tab) => JSON.stringify({id: t.id, data: t.griddata})))
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

const movedEvent = (i: any, newX: any, newY: any) => {
  const msg = "MOVED i=" + i + ", X=" + newX + ", Y=" + newY;
  console.log(msg);
  const tab: Tab | undefined = _.find(props.tabs, (t: Tab) => t.id === i)
  if (tab) {
    if (!tab.coordinates) {
      tab.coordinates = []
    }
    const optionalGriddataIndex = _.findIndex(tab.coordinates, (c: TabCoordinate) => c.identifier === props.coordinatesIdentifier)
    const gd:{[k: string]: any} = (optionalGriddataIndex >= 0)
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

const resizedEvent = (i: any, newH: number, newW: number, newHPx: any, newWPx: any) => {
  const tab: Tab | undefined = _.find(props.tabs, (t: Tab) => t.id === i)
  if (tab) {
    if (!tab.coordinates) {
      tab.coordinates = []
    }
    const optionalGriddataIndex = _.findIndex(tab.coordinates, (c: TabCoordinate) => c.identifier === props.coordinatesIdentifier)
    const gd:{[k: string]: any} = (optionalGriddataIndex >= 0)
      ? tab.coordinates.at(optionalGriddataIndex) ? tab.coordinates.at(optionalGriddataIndex)!.val : {}
      : {}
    gd['h'] = newH
    gd['w'] = newW
    if (optionalGriddataIndex < 0) {
      tab.coordinates.push(new TabCoordinate(props.coordinatesIdentifier, gd))
    }
    useTabsetsStore().saveTabset(props.tabset)
  }
}

const containerResizedEvent = (i: any, newH: any, newW: any, newHPx: any, newWPx: any) => {
  const msg = "CONTAINER RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx;
  //console.log(msg);
}

const toggleFavorite = async (tab: Tab) => {
  await useCommandExecutor().execute(new ToggleTabFavoriteCommand(tab.id))
  randomKey.value = uid()
  emits('wasClicked')
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
