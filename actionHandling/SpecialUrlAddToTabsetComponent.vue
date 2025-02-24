<template>
  <!-- SpecialUrlAddToTabsetComponent -->
  <template v-if="handler.actions(currentTabsetId).length == 0 && handler.defaultAction()">
    <q-btn
      outline
      @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, handler.defaultAction()))"
      class="q-ma-none q-px-sm q-py-none"
      :class="{ shake: animateAddtabButton, 'cursor-pointer': !alreadyInTabset() }"
      :color="alreadyInTabset() ? 'grey-5' : tsBadges.length > 0 ? 'positive' : ''"
      :size="props.level === 'root' ? 'sm' : 'xs'"
      data-testid="saveInTabsetBtn">
      <div>{{ handler.defaultAction()!.label }}</div>
      <!--                  <q-icon right class="q-ma-none q-pa-none" size="2em" name="o_south" />-->
    </q-btn>
    <q-tooltip class="tooltip-small" v-if="alreadyInTabset()">
      Tab is already contained in tabset '{{ props.tabset?.name }}'...
    </q-tooltip>
    <q-tooltip class="tooltip-small" v-else-if="tsBadges.length > 0">
      {{ tooltipAlreadyInOtherTabsets(props.tabset!.name) }}
    </q-tooltip>
    <q-tooltip class="tooltip-small" v-else>
      Add current Tab to '{{ tabsetNameOrChain(props.tabset as Tabset) }}'...
    </q-tooltip>
  </template>

  <!-- SpecialUrlAddToTabsetComponent handlerDefaultAction -->
  <template v-else-if="handler.actions(currentTabsetId).length > 0 && handler.defaultAction()">
    <!-- :disable="!handler.actions()[0]!.active(props.currentChromeTab)"-->
    <q-btn-dropdown
      :label="handler.defaultAction()!.label"
      :class="{ shake: animateAddtabButton, 'cursor-pointer': !alreadyInTabset() }"
      v-close-popup
      @click.stop="
        emits(
          'buttonClicked',
          new ActionHandlerButtonClickedHolder(handler, handler.defaultAction(), {
            filename: handler.defaultAction()!.label,
          }),
        )
      "
      class="q-ma-none q-px-none q-py-none"
      :size="props.level === 'root' ? 'sm' : 'xs'"
      :dense="handler.defaultAction()!.label.length > 15"
      split
      outline>
      <q-list dense style="min-width: 200px">
        <template v-for="l in handler.actions(currentTabsetId)">
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
    </q-btn-dropdown>
    <q-tooltip
      class="tooltip-small"
      v-if="alreadyInTabset()"
      anchor="center left"
      self="center right"
      :offset="[10, 10]">
      click the dropdown icon for more options
    </q-tooltip>
  </template>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { AddUrlToTabsetHandler } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { NoopAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'
import { Tabset } from '../models/Tabset'

const props = defineProps<{
  currentChromeTab: chrome.tabs.Tab
  tabset: Tabset
  folder?: Tabset
  level: 'root' | 'folder'
}>()

const emits = defineEmits(['buttonClicked', 'asNewFile'])

const $q = useQuasar()

const { getHandler } = useActionHandlers($q)

const handler = ref<AddUrlToTabsetHandler>(new NoopAddUrlToTabsetHandler())
const tsBadges = ref<object[]>([])
const animateAddtabButton = ref(false)
const currentTabsetId = ref<string | undefined>(undefined)

watchEffect(async () => {
  currentTabsetId.value = await useTabsetsStore().getCurrentTabsetId()
})

watchEffect(async () => {
  handler.value = getHandler(props.currentChromeTab.url, props.folder)
  // const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
  // console.log('===>', JSON.stringify(handler.value.actions(currentTabsetId)), props.folder)
})

watchEffect(() => {
  const tabsetIds = useTabsetService().tabsetsFor(props.currentChromeTab.url!)
  tsBadges.value = []
  _.forEach(tabsetIds, (tsId: string) => {
    tsBadges.value.push({
      label: TabsetService.nameForTabsetId(tsId),
      tabsetId: tsId,
      encodedUrl: btoa(props.currentChromeTab.url || ''),
    })
  })
})

watchEffect(() => {
  animateAddtabButton.value = useUiStore().animateAddtabButton
})

const alreadyInTabset = () => {
  return useTabsetService().urlExistsInCurrentTabset(props.currentChromeTab.url)
}

const activeFolderNameFor = (ts: Tabset, activeFolder: string) => {
  const folder = useTabsetsStore().getActiveFolder(ts, activeFolder)
  return folder ? folder.name : ts.name
}

const tabsetNameOrChain = (tabset: Tabset) => {
  return tabset.folderActive ? activeFolderNameFor(tabset, tabset.folderActive) : tabset.name
}

const tooltipAlreadyInOtherTabsets = (tabsetName: string) => {
  const tabsetList = _.join(
    _.map(tsBadges.value, (b: any) => b['label'] as keyof object),
    ', ',
  )
  return (
    'The current Tab is already contained in ' +
    tsBadges.value.length +
    ' other Tabsets: ' +
    tabsetList +
    '. Click to add ' +
    "it to '" +
    tabsetName +
    "' as well."
  )
}

// const isActive = (ac: ActionContext) => {
//   return ac.active ? ac.active(props.currentChromeTab) : true
// }
//
// const color = (ac: ActionContext | MenuContext) => {
//   if ((ac as ActionContext | MenuContext).active) {
//     // return (ac as (ActionContext | MenuContext))!.active(props.currentChromeTab) ? 'primary' : 'grey-5'
//     return 'primary'
//   }
//   return alreadyInTabset() ? 'grey-5' : tsBadges.value.length > 0 ? 'positive' : 'primary'
// }

//const getFolder = () => useTabsetsStore().getActiveFolder(props.tabset)
</script>
