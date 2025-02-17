<template>
  <!--  @click.stop="saveInTabset(props.tabset.id, props.tabset.folderActive)" -->
  <!--  <template v-if="handler.actions(currentTabsetId).length === 0"> -&#45;&#45;</template>-->
  <template v-if="handler.actions(currentTabsetId).length == 0 && handler.defaultAction()">
    <q-btn
      outline
      @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, handler.defaultAction()))"
      class="q-ma-none q-px-sm q-py-none"
      :class="{ shake: animateAddtabButton, 'cursor-pointer': !alreadyInTabset() }"
      :color="alreadyInTabset() ? 'grey-5' : tsBadges.length > 0 ? 'positive' : ''"
      size="xs"
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
      size="sm"
      split
      outline>
      <q-list dense style="min-width: 200px">
        <template v-for="l in handler.actions(currentTabsetId)">
          <!--          <template v-if="(l as ActionContext).dialog">-->
          <!--            <ContextMenuItem-->
          <!--              @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, l, {}))"-->
          <!--              v-close-popup-->
          <!--              :color="l.colorFkt ? l.colorFkt() : ''"-->
          <!--              :icon="l.icon ? l.icon : 'o_tab'"-->
          <!--              :label="l.label" />-->
          <!--          </template>-->
          <component :is="l" :tabset="props.tabset" />
          <!--          <template v-else>-->
          <!--            <ContextMenuItem :icon="l.icon ? l.icon : 'o_tab'" :label="l.label">-->
          <!--              <q-item-section side>-->
          <!--                <q-icon name="keyboard_arrow_right" />-->
          <!--              </q-item-section>-->
          <!--              <q-menu anchor="top end" self="top start">-->
          <!--                <q-list>-->
          <!--                  &lt;!&ndash; @click="startAutoSwitchingTab(tabset.id)" &ndash;&gt;-->
          <!--                  <q-item-->
          <!--                    v-if="useFeaturesStore().hasFeature(FeatureIdent.AUTO_TAB_SWITCHER)"-->
          <!--                    dense-->
          <!--                    clickable-->
          <!--                    v-close-popup>-->
          <!--                    <q-item-section>switching tab</q-item-section>-->
          <!--                  </q-item>-->
          <!--                  &lt;!&ndash; @click="restoreInNewWindow(tabset.id)"&ndash;&gt;-->
          <!--                  <q-item dense clickable v-close-popup>-->
          <!--                    <q-item-section>new window</q-item-section>-->
          <!--                  </q-item>-->
          <!--                  &lt;!&ndash; @click="restoreInGroup(tabset.id)"&ndash;&gt;-->
          <!--                  <q-item dense clickable v-close-popup>-->
          <!--                    <q-item-section>this window</q-item-section>-->
          <!--                  </q-item>-->
          <!--                </q-list>-->
          <!--              </q-menu>-->
          <!--            </ContextMenuItem>-->
          <!--          </template>-->
        </template>
      </q-list>
      <!--      <q-list dense style="min-width: 150px">-->
      <!--        <q-item-->
      <!--          v-for="l in handler.actions(currentTabsetId).slice(1)"-->
      <!--          :clickable="isActive(l)"-->
      <!--          dense-->
      <!--          v-close-popup-->
      <!--          @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, l, {}))">-->
      <!--          <q-item-section class="q-ma-none q-pa-none" style="max-width: 30px">-->
      <!--            <q-icon name="o_note" color="primary"></q-icon>-->
      <!--          </q-item-section>-->
      <!--          <q-item-section no-wrap class="q-ma-none q-pa-none">-->
      <!--            <q-item-label style="font-size: smaller" :class="isActive(l) ? '' : 'text-grey-5'">{{-->
      <!--              l.label-->
      <!--            }}</q-item-label>-->
      <!--          </q-item-section>-->
      <!--        </q-item>-->
      <!--      </q-list>-->
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
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { PropType, ref, watchEffect } from 'vue'
import { Tabset } from '../models/Tabset'
import { MenuContext } from './model/MenuContext'

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
const currentTabsetId = ref<string | undefined>(undefined)

watchEffect(async () => {
  currentTabsetId.value = await useTabsetsStore().getCurrentTabsetId()
})

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

const color = (ac: ActionContext | MenuContext) => {
  if ((ac as ActionContext | MenuContext).active) {
    // return (ac as (ActionContext | MenuContext))!.active(props.currentChromeTab) ? 'primary' : 'grey-5'
    return 'primary'
  }
  return alreadyInTabset() ? 'grey-5' : tsBadges.value.length > 0 ? 'positive' : 'primary'
}
</script>
