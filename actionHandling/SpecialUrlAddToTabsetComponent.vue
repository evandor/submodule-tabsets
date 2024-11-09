<template>
  <!--  @click.stop="saveInTabset(props.tabset.id, props.tabset.folderActive)" -->
  <template v-if="handler.actions().length === 0">
    ---
  </template>
  <template v-else-if="handler.actions().length === 1">
    <q-btn outline
           @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler,'', handler.actions()[0]))"
           class="q-ma-none q-px-sm q-py-none"
           :class=" { shake: animateAddtabButton, 'cursor-pointer': !alreadyInTabset() }"
           :color="alreadyInTabset() ? 'grey-5': tsBadges.length > 0 ? 'positive':'primary'"
           size="xs"
           data-testid="saveInTabsetBtn">
      <div>{{ handler.actions()[0].label }}</div>
      <!--                  <q-icon right class="q-ma-none q-pa-none" size="2em" name="o_south" />-->
    </q-btn>
    <q-tooltip class="tooltip-small" v-if="alreadyInTabset()">
      Tab is already contained in tabset '{{ props.tabset?.name }}'
    </q-tooltip>
    <q-tooltip class="tooltip-small" v-else-if="tsBadges.length > 0">
      {{ tooltipAlreadyInOtherTabsets(props.tabset!.name) }}
    </q-tooltip>
    <q-tooltip class="tooltip-small" v-else>
      Add current Tab to '{{ tabsetNameOrChain(props.tabset as Tabset) }}'...
    </q-tooltip>
  </template>

  <template v-else-if="handler.actions().length > 1">
    <q-btn-dropdown :label="handler.actions()[0].label"
                    @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, ButtonActions.Save, handler.actions()[0], {filename: handler.actions()[0].label}))"
                    class="q-ma-none q-px-sm q-py-none"
                    size="xs"
                    split
                    outline>
      <q-list dense>
        <q-item v-for="l in handler.actions().slice(1)"
                clickable dense
                @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, ButtonActions.Save, l, {}))">
          <q-item-section>
            <q-item-label>{{ l.label }}</q-item-label>
          </q-item-section>
        </q-item>

<!--        <q-item-->
<!--          clickable dense v-close-popup-->
<!--          @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, ButtonActions.SaveAs))">-->
<!--          <q-item-section>-->
<!--            <q-item-label>as new file</q-item-label>-->
<!--          </q-item-section>-->
<!--        </q-item>-->

      </q-list>
    </q-btn-dropdown>
  </template>


</template>

<script lang="ts" setup>

import {PropType, ref, watchEffect} from "vue";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {Tabset} from "../models/Tabset";
import _ from "lodash";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import TabsetService from "src/tabsets/services/TabsetService";
import {useActionHandlers} from "src/tabsets/actionHandling/ActionHandlers";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {useQuasar} from "quasar";
import {NoopAddUrlToTabsetHandler} from "src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler";
import {useContentStore} from "src/content/stores/contentStore";
import {ActionHandlerButtonClickedHolder} from "src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder";
import {useUiStore} from "src/ui/stores/uiStore";

const props = defineProps({
  currentChromeTab: {type: Object as PropType<chrome.tabs.Tab>, required: true},
  tabset: {type: Object as PropType<Tabset>, required: true},
  folder: {type: Object as PropType<Tabset>, required: false}
})

const emits = defineEmits(['buttonClicked', 'asNewFile'])

const $q = useQuasar()

const {getHandler} = useActionHandlers($q)

const handler = ref<AddUrlToTabsetHandler>(new NoopAddUrlToTabsetHandler())
const tsBadges = ref<object[]>([])
const animateAddtabButton = ref(false)


watchEffect(() => {
  handler.value = getHandler(props.currentChromeTab.url, props.folder)
})

watchEffect(() => {
  const tabsetIds = useTabsetService().tabsetsFor(props.currentChromeTab.url!)
  tsBadges.value = []
  _.forEach(tabsetIds, (tsId: string) => {
    tsBadges.value.push({
      label: TabsetService.nameForTabsetId(tsId),
      tabsetId: tsId,
      encodedUrl: btoa(props.currentChromeTab.url || '')
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
  if (tabset.folderActive) {
    return activeFolderNameFor(tabset, tabset.folderActive)
  }
  return tabset.name
}

const tooltipAlreadyInOtherTabsets = (tabsetName: string) => {
  const tabsetList = _.join(_.map(tsBadges.value, (b: any) => b['label'] as keyof object), ", ")
  return "The current Tab is already contained in " +
    tsBadges.value.length + " other Tabsets: " + tabsetList + ". Click to add " +
    "it to '" + tabsetName + "' as well."
}

</script>
