<template>

  <q-toolbar>
    <div class="row fit">
      <div class="col-xs-12 col-md-6 q-mt-xs">
        <q-toolbar-title>
          Todo
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-6 text-right">

        <q-btn v-if="tabset?.tabs.length > 0 "
               @click="setView('grid')"
               style="width:14px"
               class="q-mr-sm" size="8px"
               :flat="tabset?.view !== 'grid'"
               :outline="tabset?.view === 'grid'"
               icon="grid_on">
          <q-tooltip class="tooltip">Use grid layout to visualize your tabs</q-tooltip>
        </q-btn>

        <!-- default view, no need to show if there is no alternative -->
        <q-btn v-if="tabset?.tabs.length > 0 "
               @click="setView('list')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="tabset?.view !== 'list'"
               :outline="tabset?.view === 'list'"
               icon="o_list">
          <q-tooltip class="tooltip">Use the list layout to visualize your tabs</q-tooltip>
        </q-btn>


      </div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>

  <q-tabs
    v-model="tab"
    dense
    class="text-grey q-ma-none q-pa-none"
    active-color="primary"
    indicator-color="primary"
    align="left"
    narrow-indicator
  >
    <q-tab name="tabset" label="Tabs"/>
  </q-tabs>


  <q-tab-panels v-model="tab" animated>
    <q-tab-panel class="q-ma-none q-pa-none" name="tabset">

      <TabsetPageCards
        :tabset="tabset as unknown as Tabset"
        :simple-ui="false"/>

    </q-tab-panel>

  </q-tab-panels>

</template>

<script setup lang="ts">
import {onMounted, ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {uid, useQuasar} from "quasar";
import TabsetService from "src/tabsets/services/TabsetService";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {Tabset} from "src/tabsets/models/Tabset";
import {ToggleSortingCommand} from "src/domain/tabsets/ToggleSorting";
import Analytics from "src/core/utils/google-analytics";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import TabsetPageCards from "src/tabsets/pages/pwa/TabsetPageCards.vue";

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const tabsetId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), "empty", []))
const orderDesc = ref(false)

const tab = ref('tabset')

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelTabsetPage', document.location.href);
})


watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  tabsetId.value = route?.params.tabsetId as string
  tabset.value = useTabsetsStore().getTabset(tabsetId.value) || new Tabset(uid(), "empty", [])
  console.log("watch effect in tabsetpage", tabsetId.value)
  tab.value = route.query['tab'] ? route.query['tab'] as string : 'tabset'
})

const setView = (view: string) => TabsetService.setView(tabsetId.value, view)

const toggleSorting = () => useCommandExecutor().executeFromUi(new ToggleSortingCommand(tabsetId.value))

const toggleOrder = () => orderDesc.value = !orderDesc.value

</script>
