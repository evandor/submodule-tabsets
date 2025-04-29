<template>
  <!-- PanelTabListElementWidget left part: icon plus various -->
  <q-item-section
    @mouseover="hoveredTab = tab.id"
    @mouseleave="hoveredTab = undefined"
    class="q-mr-none q-mt-xs text-left"
    style="justify-content: start; width: 36px; max-width: 36px">
    <TabListIconItem :tabset="props.tabset!" :tab="tab" :detail-level="props.detailLevel" />
  </q-item-section>

  <!-- middle part: name, title, description, url && note -->
  <q-item-section
    class="q-mb-xs q-mt-xs q-mx-none q-pa-none"
    @mouseover="hoveredTab = tab.id"
    @mouseleave="hoveredTab = undefined">
    <TabListMainItem
      :header="props.header"
      :tabset="props.tabset"
      :filter="props.filter || undefined"
      :tab="tab"
      :detail-level="props.detailLevel" />
  </q-item-section>

  <!-- right part -->
  <slot name="actionPart">
    <q-item-section
      class="q-ma-none q-pa-none text-right"
      @mouseover="hoveredTab = tab.id"
      @mouseleave="hoveredTab = undefined"
      :style="TabService.isCurrentTab(props.tab) ? 'border-right:3px solid #1565C0;border-radius:3px' : ''"
      style="justify-content: start; width: 30px; max-width: 30px">
      <TabListActionsItem :tabset="props.tabset!" :tab="tab" :detail-level="props.detailLevel" />
    </q-item-section>
  </slot>
</template>

<script setup lang="ts">
import TabService from 'src/services/TabService'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabListActionsItem from 'src/tabsets/widgets/tabListItems/TabListActionsItem.vue'
import TabListIconItem from 'src/tabsets/widgets/tabListItems/TabListIconItem.vue'
import TabListMainItem from 'src/tabsets/widgets/tabListItems/TabListMainItem.vue'
import { ListDetailLevel } from 'src/ui/stores/uiStore'
import { PropType, ref, watchEffect } from 'vue'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
  header: { type: String, required: false },
  filter: { type: String, required: false },
  detailLevel: { type: String as PropType<ListDetailLevel>, required: false },
})

const hoveredTab = ref<string | undefined>(undefined)
const suggestion = ref<Suggestion | undefined>(undefined)

watchEffect(() => {
  if (props.tab.url) {
    suggestion.value = useSuggestionsStore().getSuggestionForUrl(props.tab.url)
  }
})
</script>

<style lang="scss" src="src/tabsets/widgets/css/panelTabListElementWidget.scss" />
