import _ from 'lodash'
import { defineStore } from 'pinia'
import { useUtils } from 'src/core/services/Utils'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { computed, ref } from 'vue'

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  return await chrome.tabs.query({ currentWindow: true })
}

/**
 * a pinia store for "browsertabs".
 */
export const useTabsStore2 = defineStore('browsertabs', () => {
  const { inBexMode, addListenerOnce } = useUtils()

  // === listeners ===
  const onTabUpdatedListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) =>
    onTabUpdated(tabId, changeInfo, tab)

  const onTabRemovedListener = (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => onTabRemoved(tabId, removeInfo)
  const onTabMovedListener = (tabId: number, removeInfo: chrome.tabs.TabMoveInfo) => onTabMoved(tabId, removeInfo)

  // === state ===
  // browser's current windows tabs, reloaded on various events
  const browserTabs = ref<chrome.tabs.Tab[]>([])

  const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)

  // tab by window id
  const currentChromeTabs = ref<Map<number, chrome.tabs.Tab>>(new Map())

  // the ids of the tabs the user activated, limited to the last X entries
  // const chromeTabsHistory = new Array<[number, string]>()
  const chromeTabsHistory = ref<[number, string][]>([]) //new Array<[number, string]>()

  // where are we in the chromeTabsHistory?
  const chromeTabsHistoryPosition = ref(-1)

  // we are currently navigating through the history?
  const chromeTabsHistoryNavigating = ref(false)

  // *** actions ***

  /**
   * initialize store with
   * @param ps a persistence storage
   */
  async function initialize() {
    if (inBexMode()) {
      browserTabs.value = await queryTabs()

      addListenerOnce(chrome.tabs.onUpdated, onTabUpdatedListener)
      addListenerOnce(chrome.tabs.onRemoved, onTabRemovedListener)
      addListenerOnce(chrome.tabs.onMoved, onTabMovedListener)
    }
  }

  // #region snippet
  async function onTabUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    if (info.status !== 'complete') {
      return
    }
    console.debug(`==> tabUpdate: ${chromeTab.url?.substring(0, 40)}`)
    browserTabs.value = await queryTabs()
  }
  // #endregion snippet

  async function onTabRemoved(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
    console.log('onTabRemoved', tabId, removeInfo)
    browserTabs.value = await queryTabs()
  }

  async function onTabMoved(tabId: number, moveInfo: chrome.tabs.TabMoveInfo) {
    console.log('onTabMoved', tabId, moveInfo)
    browserTabs.value = await queryTabs()
  }

  //async function loadTabs(eventName: string) {}

  function setCurrentChromeTab(tab: chrome.tabs.Tab) {
    currentChromeTab.value = tab
    currentChromeTabs.value.set(tab.windowId, tab)
    const MAX_HISTORY_LENGTH = 12

    // tab was activated without using the navigation
    if (tab.id && !chromeTabsHistoryNavigating.value) {
      // update urls for matching id
      chromeTabsHistory.value.forEach(([tabId, url], index) => {
        if (tabId === tab.id) {
          chromeTabsHistory.value[index] = [tabId, tab.url || '']
        }
      })

      const historyLength = chromeTabsHistory.value.length
      chromeTabsHistoryPosition.value = Math.min(MAX_HISTORY_LENGTH - 1, historyLength)
      if (
        historyLength > 0 &&
        chromeTabsHistory.value[historyLength - 1]![0] !== tab.id &&
        chromeTabsHistory.value[historyLength - 1]![1] !== tab.url
      ) {
        chromeTabsHistory.value.push([tab.id, tab.url || ''])
      } else if (historyLength === 0) {
        chromeTabsHistory.value.push([tab.id, tab.url || ''])
      } else {
        //console.log("did not add, adjusting position", historyLength - 1)
        chromeTabsHistoryPosition.value = historyLength - 1
      }
      if (chromeTabsHistory.value.length > MAX_HISTORY_LENGTH) {
        // console.log("deleting first element")
        chromeTabsHistory.value.splice(0, 1)
      }
    } else if (chromeTabsHistoryNavigating.value) {
      chromeTabsHistoryNavigating.value = false
    }
  }

  function tabHistoryBack() {
    if (chromeTabsHistoryPosition.value > 0) {
      console.log('called tabHistoryBack with', chromeTabsHistoryPosition.value)
      chromeTabsHistoryPosition.value -= 1
      chromeTabsHistoryNavigating.value = true
    }
    return chromeTabsHistory.value[chromeTabsHistoryPosition.value]
  }

  function tabHistoryForward() {
    if (chromeTabsHistoryPosition.value < chromeTabsHistory.value.length - 1) {
      console.log('called tabHistoryForward with', chromeTabsHistoryPosition.value, chromeTabsHistory.value.length)
      chromeTabsHistoryPosition.value += 1
      chromeTabsHistoryNavigating.value = true
    }
    return chromeTabsHistory.value[chromeTabsHistoryPosition.value]
  }

  function removeTab(tabset: Tabset, tabId: string) {
    tabset.tabs = _.filter(tabset.tabs as Tab[], (t: Tab) => t.id !== tabId)
    // markDuplicates(tabset)
    // if (this.pendingTabset) {
    //   this.pendingTabset.tabs = _.filter(this.pendingTabset.tabs as Tab[], (t: Tab) => t.id !== tabId)
    // }
    for (const folder of tabset.folders || []) {
      removeTab(folder, tabId)
    }
  }

  // *** getters ***
  const tabsCount = computed(() => {
    return browserTabs.value.length
  })

  // TODO needed?
  const getChromeTabs = computed(() => {
    return browserTabs.value
  })

  const getCurrentChromeTab = computed(() => {
    return (windowId: number): chrome.tabs.Tab | undefined => {
      return currentChromeTabs.value.get(windowId)
    }
  })

  return {
    initialize,
    browserTabs,
    tabsCount,
    getChromeTabs,
    setCurrentChromeTab,
    getCurrentChromeTab,
    currentChromeTab,
    tabHistoryBack,
    tabHistoryForward,
    chromeTabsHistoryNavigating,
    chromeTabsHistoryPosition,
    chromeTabsHistory,
    removeTab,
  }
})
