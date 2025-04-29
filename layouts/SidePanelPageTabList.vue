<template>
  <!-- SidePanelPageTabList -->
  <div style="width: 100%; max-width: 100%">
    <q-list class="q-ma-none">
      <!-- supporting drag & drop when not on mobile -->
      <vue-draggable-next
        v-if="tabs.length > 0"
        class="q-ma-none"
        :list="tabs"
        :group="{ name: 'tabs', pull: 'clone' }"
        @change="(event: any) => handleDragAndDrop(event)">
        <SidePanelTabListHelper
          v-for="(tab, index) in tabs"
          :key="index"
          v-once
          :tab="tab.tab as Tab"
          :index="tab.index"
          :type="props.type"
          :sorting="props.sorting"
          :preventDragAndDrop="false"
          :tabset="props.tabset!"
          :show-tabsets="props.showTabsets"
          :hide-menu="props.hideMenu"
          :filter="props.filter || ''" />
      </vue-draggable-next>
      <div v-else-if="props.filter" class="q-ma-md text-caption">
        Filter <em>'{{ props.filter }}'</em> did not match anything inside this collection. Click 'Enter' to search in
        all your collections.
      </div>
      <div v-else-if="props.tabset?.folders.length === 0" class="q-ma-md text-caption text-center text-grey-8">
        Empty Tabset<br />
        check the
        <span class="cursor-pointer" @click="useUiStore().startButtonAnimation('addtab')">action menu</span><br />
        (Add Tab etc.)<br />
      </div>
    </q-list>

    <audio id="myAudio">
      <source src="/mp3/click.mp3" type="audio/mp3" />
    </audio>
  </div>
</template>

<script lang="ts" setup>
import SidePanelTabListHelper from 'src/tabsets/layouts/SidePanelTabListHelper.vue'
import { IndexedTab } from 'src/tabsets/models/IndexedTab'
import { Tab, TabSorting } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { PropType, ref, watch } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'

const props = defineProps({
  hideMenu: { type: Boolean, default: false },
  sorting: { type: String as PropType<TabSorting>, default: TabSorting.CUSTOM },
  type: { type: String, default: 'sidepanel' },
  showTabsets: { type: Boolean, default: false },
  tabset: { type: Object as PropType<Tabset>, required: false },
  tabsCount: { type: Number, default: -1 },
  activeFolder: { type: String, required: false },
  filter: { type: String, required: false },
})

const emits = defineEmits(['tabs-found'])

const tabs = ref<IndexedTab[]>([])

watch(
  () => props.filter,
  (a: string | undefined, b: string | undefined) => {
    console.log('got filter', a, b)
    tabs.value = tabsForColumn()
    console.log('emitting2!', tabs.value.length)
    emits('tabs-found', tabs.value.length)
  },
)

watch(
  () => props.tabset?.tabs || [],
  (a: Tab[], b: Tab[]) => {
    console.log('got filter', a, b)
    tabs.value = tabsForColumn()
    console.log('emitting1!', tabs.value.length)
    emits('tabs-found', tabs.value.length)
  },
)

const handleDragAndDrop = async (event: any) => {
  console.log('SidePanelPageTabList d&d event:', event, props)
  const { moved, added } = event
  if (moved) {
    console.log(`moved event: '${moved.element.tab.id}' ${moved.oldIndex} -> ${moved.newIndex} (${props.activeFolder})`)
    const tabsInColumn = tabsForColumn()
    const movedElement: Tab = tabsInColumn[moved.oldIndex]!.tab
    const realNewIndex = tabsInColumn[moved.newIndex]!.index
    console.log(`             '${movedElement.id}' ${moved.oldIndex} -> ${realNewIndex}`)
    await TabsetService.moveTo(movedElement.id, realNewIndex, props.activeFolder)
  }
  if (added) {
    console.log(`added event: '${added.element.tab.id}' ${added.oldIndex} -> ${added.newIndex}`)
    const tabsInColumn = tabsForColumn()
    const movedElement: Tab = added.element.tab
    const realNewIndex = added.newIndex < tabsInColumn.length ? tabsInColumn[added.newIndex]!.index : 0
    console.log(`             '${added.element.tab.id}' ${added.oldIndex} -> ${realNewIndex}`)
    //movedElement.columnId = column.id
    await useTabsetService().saveCurrentTabset()
  }
}

const tabsForColumn = (): IndexedTab[] => {
  function filterMatches(property: string | undefined): boolean {
    if (!property) {
      return false
    }
    const match = property.toLowerCase().indexOf(props.filter!.toLowerCase()) >= 0
    // console.log(`matching ${property} with filter ${props.filter!.toLowerCase()}: ${match}`)
    return match
  }

  return (props.tabset?.tabs as Tab[])
    .filter((t: Tab) => {
      // console.log('')
      // console.log('checking tab', t.url)
      if (!props.filter || props.filter.trim() === '') {
        return true
      }
      // console.log('match in url', filterMatches(t.url))
      // console.log('match in description', filterMatches(t.description))
      // console.log('match in name', filterMatches(t.name))
      // console.log('match in title', filterMatches(t.title))
      const res =
        filterMatches(t.url) || filterMatches(t.description) || filterMatches(t.name) || filterMatches(t.title)

      // if (res) {
      //   console.log('found tab', t.url, res)
      // }
      return res
    })
    .sort((a: Tab, b: Tab) => {
      return props.tabset && props.tabset.type === TabsetType.RSS_FOLDER ? b.created - a.created : 0
    })
    .map((t: Tab, index: number) => new IndexedTab(index, t))
}

tabs.value = tabsForColumn()
// console.log('---')
emits('tabs-found', tabs.value.length)
</script>

<style>
.q-expansion-item--popup > .q-expansion-item__container {
  border: 0 solid rgba(0, 0, 0, 0.12) !important;
}

.q-list--separator > .q-item-type + .q-item-type,
.q-list--separator > .q-virtual-scroll__content > .q-item-type + .q-item-type {
  border-top: 0 solid rgba(100, 0, 0, 0.12) !important;
}
</style>
