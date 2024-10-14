<template>
  <!--  @click.stop="saveInTabset(props.tabset.id, props.tabset.folderActive)" -->
  <template v-if="handler.actions().length === 1">
    <q-btn outline
           @click="emits('buttonClicked', handler.actions()[0].identifier)"
           class="q-ma-none q-px-sm q-py-none"
           :class="alreadyInTabset() ? '':'cursor-pointer'"
           :color="alreadyInTabset() ? 'grey-5': tsBadges.length > 0 ? 'positive':'warning'"
           size="xs"
           data-testid="saveInTabsetBtn">
      <div>{{handler.actions()[0].label}}</div>
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

  <template v-else>
    <q-btn-dropdown :label="'save as ' + handler.actions()[0]" split
                    class="q-ma-none q-px-sm q-py-none"
                    size="xs"
                    outline>
      <q-list dense>
<!--        <q-item v-for="l in handler.actions"-->
<!--                clickable dense-->
<!--                @click.stop="emits('asNewFile')">-->
<!--          <q-item-section>-->
<!--            <q-item-label>save as {{ l }}</q-item-label>-->
<!--          </q-item-section>-->
<!--        </q-item>-->

<!--        <q-item-->
<!--          clickable dense v-close-popup-->
<!--          @click.stop="emits('asNewFile')">-->
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
import {useUrlHandlers} from "src/tabsets/specialHandling/SpecialUrls";
import {AddUrlToTabsetHandler} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";

const props = defineProps({
  currentChromeTab: {type: Object as PropType<chrome.tabs.Tab>, required: true},
  tabset: {type: Object as PropType<Tabset>, required: true}
})

const emits = defineEmits(['buttonClicked'])

const {getHandler} = useUrlHandlers()

const handler = ref<AddUrlToTabsetHandler>(getHandler(props.currentChromeTab.url))

const tsBadges = ref<object[]>([])

watchEffect(() => {
  handler.value = getHandler(props.currentChromeTab.url)
})

watchEffect(() => {
  const tabsetIds = useTabsetService().tabsetsFor(props.currentChromeTab.url!)
  tsBadges.value = []
  //created.value = undefined
  _.forEach(tabsetIds, (tsId: string) => {
    tsBadges.value.push({
      label: TabsetService.nameForTabsetId(tsId),
      tabsetId: tsId,
      encodedUrl: btoa(props.currentChromeTab.url || '')
    })
  })
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
