<template>
  <q-menu :offset="[0, 0]" @click.stop="">
    <q-list dense style="min-width: 200px">
      <q-item
        v-if="defaultAction"
        clickable
        v-close-popup
        @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, defaultAction))">
        <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
          <q-icon size="xs" :name="defaultAction.icon" color="info" />
        </q-item-section>
        <q-item-section>{{ defaultAction.label }}</q-item-section>
      </q-item>

      <template
        v-for="l in handler.actions(currentTabsetId, {
          tabset: props.tabset,
          level: props.level,
          currentChromeTab: props.currentChromeTab,
        })">
        <template v-if="'context' in l">
          <component
            :key="l.component.name"
            :is="l.component"
            :tabset="props.tabset"
            :folder="props.folder"
            :currentChromeTab="props.currentChromeTab"
            :level="props.level"
            :context="'context' in l ? l.context : {}" />
        </template>
        <template v-else>
          <component :key="l.name" :is="l" :tabset="props.tabset" :folder="props.folder" :level="props.level" />
        </template>
      </template>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { AddUrlToTabsetHandler } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { NoopAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext' // const props = defineProps({
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  currentChromeTab: chrome.tabs.Tab
  tabset: Tabset
  folder?: Tabset
  level: 'root' | 'folder'
}>()

const emits = defineEmits(['toggleExpand', 'buttonClicked'])

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const fullpageView = route.fullPath.startsWith('/sidepanel/tabsets/')

const currentTabsetId = ref<string | undefined>(undefined)
const alreadyInTabset = ref(false)
const defaultAction = ref<ActionContext | undefined>(undefined)

const handler = ref<AddUrlToTabsetHandler>(new NoopAddUrlToTabsetHandler())

const theColor = ref<string | undefined>(undefined)

const { getHandler } = useActionHandlers($q)

watchEffect(() => {
  handler.value = getHandler(props.currentChromeTab.url, props.folder)
  console.log('handler!!!', handler.value)
  defaultAction.value = handler.value.defaultAction()
})

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tsId: string | undefined) => (currentTabsetId.value = tsId))
})

async function tabToUse(tab: Tab) {
  let useTab: Tab = tab
  if (tab.placeholders?.templateId) {
    const tabInfo = useTabsetsStore().getTabAndTabsetId(tab.placeholders?.templateId)
    if (tabInfo) {
      useTab = tabInfo.tab
      console.log('useTab', useTab, tab.placeholders?.templateId)
    }
  }
  return useTab
}
</script>
