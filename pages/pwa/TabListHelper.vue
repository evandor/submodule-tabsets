<template>
  <!-- TabListHelper -->
  <q-item
    v-if="props.tabs?.length === 0 && inBexMode() && useUiStore().rightDrawer.activeTab === DrawerTabs.UNASSIGNED_TABS">
    <div class="row fit q-ma-lg q-pa-lg text-subtitle2 text-grey-8">
      You can drag and drop items from the "Tabs to add" view to add them to this tabset by clicking on the icons
    </div>
  </q-item>
  <q-item
    clickable
    v-ripple
    v-for="tab in props.tabs"
    class="q-ma-none q-pa-xs"
    :style="itemStyle(tab)"
    @mouseover="showButtons(tab.id, true)"
    @mouseleave="showButtons(tab.id, false)"
    @dragstart="startDrag($event, tab)"
    :key="props.group + '_' + tab.id">
    <PanelTabListElementWidget
      :key="props.group + '__' + tab.id"
      :tab="tab"
      :tabset="props.tabset!"
      :detail-level="props.detailLevel as ListDetailLevel" />
  </q-item>
</template>

<script lang="ts" setup>
import { useUtils } from 'src/core/services/Utils'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import PanelTabListElementWidget from 'src/tabsets/widgets/PanelTabListElementWidget.vue'
import { DrawerTabs, ListDetailLevel, useUiStore } from 'src/ui/stores/uiStore'
import { PropType, ref } from 'vue'

const props = defineProps({
  tabs: { type: Array as PropType<Tab[]>, required: true },
  tabsetId: { type: String, required: true },
  group: { type: String, required: true },
  highlightUrl: { type: String, required: false },
  tabsetSharedId: { type: String, required: false },
  tabsetMqttUrl: { type: String, required: false },
  tabset: { type: Object as PropType<Tabset>, required: false },
  simpleUi: { type: Boolean, default: false },
  detailLevel: { type: String as PropType<ListDetailLevel>, required: false },
})

const { inBexMode } = useUtils()

const showDetails = (tab: Tab) => {
  // useUiStore().setSelectedTab(tab)
  useUiStore().rightDrawerSetActiveTab(DrawerTabs.TAB_DETAILS)
}

const itemStyle = (tab: Tab) => {
  if (tab.url === props.highlightUrl) {
    return 'border: 1px dotted orange; padding:15px; border-radius:5px'
  }
  return 'border-bottom: 1px solid #fafafa'
}

const showButtonsProp = ref<Map<string, boolean>>(new Map())

const tabAsTab = (tab: Tab): Tab => tab as unknown as Tab

const showButtons = (tabId: string, show: boolean) => showButtonsProp.value.set(tabId, show)

const startDrag = (evt: any, tab: Tab) => {
  console.debug('start drag', evt, tab)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    evt.dataTransfer.setData('text/plain', tab.id)
    useUiStore().draggingTab(tab.id, evt, true)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}
</script>
