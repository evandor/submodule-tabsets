<template>
  <!--  @click.stop="saveInTabset(props.tabset.id, props.tabset.folderActive)" -->
  <template v-if="handler.actions().length === 0"> ---</template>
  <template v-else-if="handler.actions().length === 1">
    <q-btn
      outline
      @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, '', handler.actions()[0]))"
      class="q-ma-none q-px-sm q-py-none"
      :class="{ shake: animateAddtabButton, 'cursor-pointer': !alreadyInTabset() }"
      :color="alreadyInTabset() ? 'grey-5' : tsBadges.length > 0 ? 'positive' : ''"
      size="xs"
      data-testid="saveInTabsetBtn">
      <div>{{ handler.actions()[0]!.label }}</div>
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

  <template v-else-if="handler.actions().length > 1">
    <!-- :disable="!handler.actions()[0]!.active(props.currentChromeTab)"-->
    <q-btn-dropdown
      :label="handler.actions()[0]!.label"
      v-close-popup
      @click.stop="
        emits(
          'buttonClicked',
          new ActionHandlerButtonClickedHolder(handler, ButtonActions.Save, handler.actions()[0], {
            filename: handler.actions()[0]!.label,
          }),
        )
      "
      class="q-ma-none q-px-none q-py-none"
      :color="color(handler.actions()[0]!)"
      size="xs"
      split
      outline>
      <q-list dense>
        <q-item
          v-for="l in handler.actions().slice(1)"
          :clickable="isActive(l)"
          dense
          @click.stop="
            emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, ButtonActions.Save, l, {}))
          ">
          <q-item-section>
            <q-item-label style="font-size: smaller" :class="isActive(l) ? '' : 'text-grey-5'">{{
              l.label
            }}</q-item-label>
          </q-item-section>
        </q-item>
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
import { AddUrlToTabsetHandler, ButtonActions } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { NoopAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { PropType, ref, watchEffect } from 'vue'
import { Tabset } from '../models/Tabset'

const props = defineProps({
  currentChromeTab: { type: Object as PropType<chrome.tabs.Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: true },
  folder: { type: Object as PropType<Tabset>, required: false },
})

const emits = defineEmits(['buttonClicked', 'asNewFile'])

const $q = useQuasar()

const { getHandler } = useActionHandlers($q)

const handler = ref<AddUrlToTabsetHandler>(new NoopAddUrlToTabsetHandler())
const tsBadges = ref<object[]>([])
const animateAddtabButton = ref(false)

watchEffect(() => {
  handler.value = getHandler(props.currentChromeTab.url, props.folder)
  // console.log("===>",JSON.stringify(handler.value.actions()), props.folder)
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

const isActive = (ac: ActionContext) => {
  return ac.active ? ac.active(props.currentChromeTab) : true
}

const color = (ac: ActionContext) => {
  if (ac.active) {
    return ac.active(props.currentChromeTab) ? 'primary' : 'grey-5'
  }
  return alreadyInTabset() ? 'grey-5' : tsBadges.value.length > 0 ? 'positive' : 'primary'
}
</script>
