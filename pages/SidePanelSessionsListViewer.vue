<template>
  <!-- SidePanelSessionsListViewer -->

  <div class="row q-mt-xs">
    <!--    <div class="col-6 q-mt-sm">-->
    <!--      <SidePanelTabsetsSelectorWidget :use-as-tabsets-switcher="true" />-->
    <!--    </div>-->
    <!--    <div class="col-6 text-right">-->
    <!--      <template v-if="useWindowsStore().allWindows.size > 1">-->
    <!--        Current Window only-->
    <!--        <q-checkbox v-model="currentWindowOnly" />-->
    <!--      </template>-->
    <!--    </div>-->
    <!--    <div class="col-11 q-mb-xs">-->
    <!--      <q-input dense autofocus ref="filterRef" filled :hint="filterHint()" v-model="filter" label="Filter Tabs">-->
    <!--        <template v-slot:append>-->
    <!--          <q-icon v-if="filter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />-->
    <!--        </template>-->
    <!--      </q-input>-->
    <!--    </div>-->
    <!--    <div class="col text-right">-->
    <!--      <q-icon :name="sortByUrl ? 'undo' : 'sort'" color="primary" class="cursor-pointer" @click="toggleSorting()">-->
    <!--        <q-tooltip class="tooltip-small">Toggle Sorting between custom and URL</q-tooltip>-->
    <!--      </q-icon>-->
    <!--    </div>-->
  </div>

  <div class="q-pa-none">
    <q-list class="rounded-borders">
      <q-expansion-item
        group="browserWindowSessions"
        v-for="session in tabsetsSessions"
        expand-separator
        :label="'' + session.name"
        :caption="'Tabsets Session - ' + session.tabs.length + ' tabs(s)'">
        <q-card>
          <q-card-section>
            <div class="q-ma-none q-mb-md cursor-pointer text-right text-caption" @click="openSession(session)">
              open session
            </div>
            <div v-for="tab in session.tabs" class="q-my-none tabBorder q-mb-xs">
              {{ tab.title }}
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <!--      <q-expansion-item group="browserWindowSessions" expand-separator label="Recently Closed Tabs">-->
      <!--        <q-card>-->
      <!--          <q-card-section>-->
      <!--            &lt;!&ndash;            <div&ndash;&gt;-->
      <!--            &lt;!&ndash;              class="q-ma-none q-mb-md cursor-pointer text-right text-caption"&ndash;&gt;-->
      <!--            &lt;!&ndash;              @click="restoreSession(session.window?.sessionId)">&ndash;&gt;-->
      <!--            &lt;!&ndash;              restore session&ndash;&gt;-->
      <!--            &lt;!&ndash;            </div>&ndash;&gt;-->
      <!--            <div v-for="session in recentlyClosedBrowserSessions" class="q-my-none tabBorder q-mb-xs">-->
      <!--              <SimpleBrowserTabCard v-if="session.tab" :chromeTab="session.tab" />-->
      <!--            </div>-->
      <!--          </q-card-section>-->
      <!--        </q-card>-->
      <!--      </q-expansion-item>-->
    </q-list>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import Analytics from 'src/core/utils/google-analytics'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'

const recentlyClosedBrowserSessions = ref<chrome.sessions.Session[]>([])
const tabsetsSessions = ref<Tabset[]>([])
const useSelection = ref(false)
const userCanSelect = ref(false)

const tabSelection = ref<Set<string>>(new Set<string>())
const tabs = ref<chrome.tabs.Tab[]>([])

onMounted(async () => {
  Analytics.firePageViewEvent('SidePanelSessionsListViewer', document.location.href)
  recentlyClosedBrowserSessions.value = await chrome.sessions.getRecentlyClosed()
  console.log('recently closed', recentlyClosedBrowserSessions.value)
  tabsetsSessions.value = [...useTabsetsStore().tabsets.values()].filter((ts: Tabset) => ts.type === TabsetType.SESSION)

  //chrome.sessions.getDevices()
})

watchEffect(() => {
  tabs.value = useTabsStore2().browserTabs
  const filterTerm = useUiStore().toolbarFilterTerm.toLowerCase()
  if (filterTerm.length > 0) {
    tabs.value = _.filter(
      tabs.value,
      (t: chrome.tabs.Tab) =>
        !!((t.url && t.url?.indexOf(filterTerm) >= 0) || (t.title && t.title.toLowerCase()?.indexOf(filterTerm) >= 0)),
    )
  }
})

watchEffect(() => {
  userCanSelect.value = false
})

const tabSelectionChanged = (a: any) => {
  const { tabId, selected } = a
  if (selected) {
    tabSelection.value.add(tabId)
  } else {
    tabSelection.value.delete(tabId)
  }
}

const openSession = (session: Tabset) => {
  useTabsetService().selectTabset(session.id)
  useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
}

const restoreSession = async (sessionId?: string) => {
  const reason = await chrome.sessions.restore(sessionId) //.then((reason: any) => {
  console.log('restored session', reason)
  recentlyClosedBrowserSessions.value = await chrome.sessions.getRecentlyClosed()
}

const cardStyle = (tab: chrome.tabs.Tab) => {
  let background = ''
  if (useTabsetService().urlExistsInCurrentTabset(tab.url || '')) {
    background = 'background: #efefef'
  } else {
    // emits('hasSelectable', true)
  }
  return `${background}`
}
</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0
</style>
