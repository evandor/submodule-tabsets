<template>
  <!-- MainPanelTabsetOverviewPage -->
  <q-toolbar>
    <div class="row fit">
      <div class="col-8 q-mt-xs">
        <q-toolbar-title>
          Overview of <em>{{ tabset.name }}</em>
        </q-toolbar-title>
      </div>
      <div class="col-4 text-right">

        <q-btn @click="openAllTabsetsOverview()"
               style="width:14px"
               class="q-mr-sm" size="8px"
               icon="stars">
          <q-tooltip class="tooltip">Show all favorites</q-tooltip>
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
    narrow-indicator>
    <q-tab name="grid" label="As Grid" @click="setView('grid')"/>
    <q-tab name="list" label="As List" @click="setView('list')"/>
    <q-tab name="list" label="As Timeline" @click="setView('timeline')"/>
  </q-tabs>


  <q-tab-panels v-model="tab" animated>
    <q-tab-panel class="q-ma-none q-pa-none" name="grid">

      <TabsetPageCards
        :tabset="tabset as unknown as Tabset"
        :simple-ui="false"/>


    </q-tab-panel>

    <q-tab-panel class="q-ma-none q-pa-none" name="list">

      <TabList
        group="otherTabs"
        :tabsetId="tabset.id"
        :tabsetSorting="tabset?.sorting"
        :tabsetSharedId="tabset?.sharedId"
        :tabs="tabset.tabs"/>

    </q-tab-panel>

    <q-tab-panel class="q-ma-none q-pa-none" name="timeline">
      todo
<!--      <Timeline-->
<!--        :groups="groups"-->
<!--        :items="items"-->
<!--        :viewportMin="1703112200000"-->
<!--        :viewportMax="1714566600000"-->
<!--      />-->
    </q-tab-panel>

  </q-tab-panels>

</template>

<script setup lang="ts">
import {onMounted, ref, watchEffect} from 'vue'
import {useRoute} from "vue-router";
import {uid} from "quasar";
import TabsetService from "src/tabsets/services/TabsetService";
import {Tabset} from "src/tabsets/models/Tabset";
import Analytics from "src/core/utils/google-analytics";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import TabsetPageCards from "src/tabsets/pages/pwa/TabsetPageCards.vue";
import NavigationService from "src/services/NavigationService";
import TabList from "src/tabsets/pages/pwa/TabList.vue";
import { Timeline } from 'vue-timeline-chart';
import 'vue-timeline-chart/style.css';

const route = useRoute()

const tabsetId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), "empty", []))

const tab = ref('')

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelTabsetPage', document.location.href);
})

const setView = (view: string) => TabsetService.setView(tabsetId.value, view)

watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  tabsetId.value = route?.params.tabsetId as string
  tabset.value = useTabsetsStore().getTabset(tabsetId.value) || new Tabset(uid(), "empty", [])
  tab.value = tabset.value.view || 'grid'
  console.log("watch effect in tabsetpage", tabsetId.value)
  //tab.value = route.query['tab'] ? route.query['tab'] as string : 'tabset'
})

const groups = [
  { id: 'group1', label: 'Group 1' },
  { id: 'group2', label: 'Group 2' },
];

const items = [
  { group: 'group1', type: 'point', start: 1705878000000, cssVariables: { '--item-background': 'var(--color-2)' } },
  { group: 'group1', type: 'range', start: 1707135072000, end: 1708431072000, cssVariables: { '--item-background': 'var(--color-4)' } },
  { group: 'group2', type: 'range', start: 1706790600000, end: 1706877000000 },
];

const openAllTabsetsOverview = () =>
  NavigationService.openOrCreateTab([chrome.runtime.getURL(`www/index.html#/mainpanel/tabsets/overview`)])

</script>
