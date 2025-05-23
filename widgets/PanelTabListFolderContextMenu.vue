<template>
  <q-menu :offset="[0, 0]">
    <q-list dense style="min-width: 200px">
      <!--      <q-item-->
      <!--        v-if="defaultAction"-->
      <!--        clickable-->
      <!--        v-close-popup-->
      <!--        @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, defaultAction))">-->
      <!--        <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">-->
      <!--          <q-icon size="xs" :name="defaultAction.icon" color="info" />-->
      <!--        </q-item-section>-->
      <!--        <q-item-section>{{ defaultAction.label }}</q-item-section>-->
      <!--      </q-item>-->

      <template v-for="l in actions">
        <template v-if="'context' in l">
          <component
            :key="l.component.name"
            :is="l.component"
            :tabset="props.tabset"
            :folder="props.folder"
            :currentChromeTab="props.currentChromeTab"
            :level="props.level"
            element="contextmenu" />
        </template>
      </template>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { AddUrlToTabsetHandler, ComponentWithContext } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { NoopAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, shallowRef, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  currentChromeTab: chrome.tabs.Tab
  tabset: Tabset
  folder?: Tabset
  level: 'root' | 'folder'
}>()

const emits = defineEmits(['toggleExpand', 'buttonClicked'])

const $q = useQuasar()
const route = useRoute()

const currentTabsetId = ref<string | undefined>(undefined)
const actions = shallowRef<ComponentWithContext[]>([])

const handler = ref<AddUrlToTabsetHandler>(new NoopAddUrlToTabsetHandler())

const { getHandler } = useActionHandlers($q)

watchEffect(() => {
  handler.value = getHandler(props.currentChromeTab.url, props.folder)
  // defaultAction.value = handler.value.defaultAction()
  // showExtraMenuItems()
  actions.value = handler.value.actions(currentTabsetId.value, {
    tabset: props.tabset,
    level: 'folder',
    currentChromeTab: props.currentChromeTab,
    element: 'contextmenu',
  })
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
