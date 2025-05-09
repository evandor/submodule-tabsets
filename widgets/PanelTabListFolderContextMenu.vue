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

      <template v-for="l in handler.actions(currentTabsetId, { tabset: props.tabset, level: props.level })">
        <template v-if="'context' in l">
          <component
            :key="l.component.name"
            :is="l.component"
            :tabset="props.tabset"
            :folder="props.folder"
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
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { AddUrlToTabsetHandler } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { NoopAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext' // const props = defineProps({
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import { UpdateTabColorCommand } from 'src/tabsets/commands/UpdateTabColor'
import EditUrlDialog from 'src/tabsets/dialogues/EditUrlDialog.vue'
import { PlaceholdersType } from 'src/tabsets/models/Placeholders'
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

const showTabDetails = async (tab: Tab) => {
  const useTab: Tab = await tabToUse(tab)
  console.log('showing tab details for', useTab)
  router.push('/sidepanel/tab/' + useTab.id)
}

const showTabDetailsMenuEntry = (tab: Tab) => useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE) && !fullpageView

const deleteTabLabel = (tab: Tab) =>
  tab.placeholders && tab.placeholders.type === PlaceholdersType.URL_SUBSTITUTION ? 'Delete all' : 'Delete Tab'

const editURL = async (tab: Tab) => {
  let useTab = await tabToUse(tab)
  $q.dialog({
    component: EditUrlDialog,
    componentProps: {
      tab: useTab,
    },
  })
}

const assignTab = async (tab: Tab) =>
  await NavigationService.openOrCreateTab([chrome.runtime.getURL('/www/index.html#/mainpanel/tabAssignment/' + tab.id)])

const setColor = (tab: Tab) => useCommandExecutor().execute(new UpdateTabColorCommand(tab, theColor.value))

const hasSubfolder = () => {
  if (!props.tabset) {
    return false
  }
  const activeFolder = useTabsetsStore().getActiveFolder(props.tabset)
  return activeFolder ? activeFolder.folders.length > 0 : false
}
</script>
