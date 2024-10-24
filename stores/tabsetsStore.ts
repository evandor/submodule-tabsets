import {defineStore} from 'pinia';
import _, {forEach} from 'lodash'
import {computed, ref} from "vue";
import {uid} from "quasar";
import {Tabset, TabsetSharing, TabsetStatus} from "src/tabsets/models/Tabset";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {Tab, TabComment, UrlExtension} from "src/tabsets/models/Tab";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {STRIP_CHARS_IN_COLOR_INPUT, STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {TabAndTabsetId} from "src/tabsets/models/TabAndTabsetId";
import NavigationService from "src/services/NavigationService";
import {AccessItem, useAuthStore} from "stores/authStore";

/**
 * a pinia store for "Tabsets".
 *
 * Elements are persisted to the storage provided in the initialize function
 */

export const useTabsetsStore = defineStore('tabsets', () => {

    /**
     * the (internal) storage for this store to use
     */
    let storage: TabsetsPersistence = null as unknown as TabsetsPersistence

    /**
     * a named list of tabsets managed by this extension.
     */
    const tabsets = ref<Map<string, Tabset>>(new Map<string, Tabset>())

    /**
     * the currently selected tabset's id if any. Storing the tabset itself leads to
     * inconsistencies with the tabsets Map.
     */
    const currentTabsetId = ref<string | undefined>(undefined)

    /**
     * initialize store with
     * @param ps a persistence storage
     */
    async function initialize(ps: TabsetsPersistence) {
      storage = ps
      await storage.init()
      // TODO remove after version 0.5.0
      await storage.migrate()

      console.debug(" ...initialized tabsets: Store",'✅')
      await storage.loadTabsets()
    }

    function setTabset(ts: Tabset) {
      tabsets.value.set(ts.id, ts)
    }

    async function loadTabsets() {
      await storage.loadTabsets()
    }

    async function reloadTabset(tabsetId: string) {
      const updatedTabset = await storage.reloadTabset(tabsetId)
      console.log("updatedTabset", updatedTabset)
      tabsets.value.set(tabsetId, updatedTabset)
      console.log("tabsets", tabsets)
    }

    async function createTabset(
      tabsetName: string, tabs: Tab[],
      color: string | undefined = undefined,
      dynamicUrl: URL | undefined = undefined,
      spaceId: string | undefined = undefined

    ): Promise<Tabset> {
      const currentTabsetsCount = tabsets.value.size
      if (useAuthStore().limitExceeded(AccessItem.TABSETS, currentTabsetsCount)) {
        await NavigationService.openOrCreateTab([chrome.runtime.getURL("/www/index.html#/mainpanel/settings?tab=account")])
        return Promise.reject("tabsetLimitExceeded")
      }

      const trustedName = tabsetName.replace(STRIP_CHARS_IN_USER_INPUT, '')
        .substring(0, 31)
      const trustedColor = color ?
        color.replace(STRIP_CHARS_IN_COLOR_INPUT, '').substring(0, 31)
        : undefined


      const tabsetWithSameName: Tabset | undefined = _.find([...tabsets.value.values()] as Tabset[], (ts: Tabset) => ts.name === trustedName)
      let ts: Tabset = null as unknown as Tabset
      if (tabsetWithSameName) {
        if (tabsetWithSameName.status === TabsetStatus.DELETED) {
          // TODO
          // delete Tabset(tabsetWithSameName)
        } else {
          return Promise.reject(`tabset with same name ('${trustedName}') exists already`)
        }
      }

      ts = new Tabset(uid(), trustedName, tabs, [])
      ts.color = trustedColor
      ts.dynamicUrl = dynamicUrl?.toString()
      if (spaceId) {
        ts.spaces = [spaceId]
      }
      tabsets.value.set(ts.id, ts)
     // console.log("storage", storage)
      await storage.addTabset(ts)

      // TODO
      // if (currentSpace && currentSpace.id && ts.spaces.findIndex(s => s === currentSpace.id) < 0) {
      //   ts.spaces.push(currentSpace.id)
      // }

      return Promise.resolve(ts)
    }

    function addTabset(ts: Tabset) {
      console.log("adding tabset (new)", ts)
      ts.tabs = _.filter(ts.tabs, (t: Tab) => t !== null)

      // this part is meant to be used to update tabs in case properties
      // are deprecated
      let foundSomething = false
      ts.tabs.forEach((t: Tab) => {
        if (t.note && t.note.trim().length > 0) {
          foundSomething = true
          console.warn("deprecated property: found tab with note, turning into comment")
          if (!t.comments) {
            t.comments = []
          }
          t.comments.push(new TabComment("", t.note))
          delete t['note' as keyof object]
        }
      })
      if (foundSomething) {
        useTabsetService().saveTabset(ts)
      }

      useWindowsStore().addToWindowSet(ts.window)

      if (ts.sharing === TabsetSharing.PUBLIC_LINK || ts.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED) {
        // MqttService.init()
        // if (ts.sharedId) {
        //   MqttService.subscribe(ts.sharedId)
        // }
      }

      tabsets.value.set(ts.id, ts)
      // TODO markDuplicates(ts)
    }

    async function saveTabset(ts: Tabset) {
      return await storage.saveTabset(JSON.parse(JSON.stringify(ts)))
    }

    function deleteTabset(tsId: string) {
      return storage.deleteTabset(tsId)
        .then((res) => {
          tabsets.value.delete(tsId)
          if (currentTabsetId.value && currentTabsetId.value === tsId) {
            currentTabsetId.value = undefined
          }
          return res
        })
    }

    function selectCurrentTabset(tabsetId: string): Tabset | undefined {
      const found = _.find([...tabsets.value.values()] as Tabset[], (k: any) => {
        const ts = k || new Tabset("", "", [])
        return ts.id === tabsetId
      })
      if (found) {
        //console.log("found", found)
        currentTabsetId.value = found.id //this.tabsets.get(found) || new Tabset("", "", [])

        //ChromeApi.buildContextMenu("tabsStore")
        return found
      } else {
        console.debug("not found:", tabsetId)//, [...this.tabsets.values()])
      }
      return undefined
    }

    function unsetCurrentTabset(): void {
      currentTabsetId.value = undefined
    }

    function share(tabset: Tabset, sharing: TabsetSharing, sharedId: string | undefined, sharedBy: string) {
      return storage.share(tabset, sharing, sharedId, sharedBy)
    }

    // *** getters ***

    const getCurrentTabs = computed((): Tab[] => {
      if (currentTabsetId.value) {
        return tabsets.value.get(currentTabsetId.value)?.tabs as Tab[] || []
      }
      return [] as Tab[]
    })

    const getCurrentTabset = computed((): Tabset | undefined => {
      return currentTabsetId.value ? tabsets.value.get(currentTabsetId.value) as Tabset | undefined : undefined
    })

    const currentTabsetName = computed(() => {
      return currentTabsetId.value ? tabsets.value.get(currentTabsetId.value)?.name : undefined
    })

    const tabForUrlInSelectedTabset = computed(() => {
      return (url: string): Tab | undefined => {
        if (currentTabsetId.value) {
          const tabs: Tab[] = tabsets.value.get(currentTabsetId.value)?.tabs as Tab[] || []
          return _.find(tabs, (t: any) => t.url === url)
        }
      }
    })

    const getTabset = computed(() => {
      return (tabsetId: string): Tabset | undefined => {
        return tabsets.value.get(tabsetId) as Tabset | undefined
      }
    })

    const existingInTabset = computed(() => {
      return (searchName: string, spaceId: string | undefined = undefined): Tabset | undefined => {
        const trustedName = searchName.replace(STRIP_CHARS_IN_USER_INPUT, '')
        return _.find([...tabsets.value.values()] as Tabset[], (ts: Tabset) => {
          if (!spaceId) {
            return ts.name === trustedName?.trim()
          } else {
            return ts.name === trustedName?.trim() && ts.spaces.indexOf(spaceId) >= 0
          }
        })
      }
    })

    const getTabAndTabsetId = computed(() => {
      return (tabId: string): TabAndTabsetId | undefined => {
        for (const value of tabsets.value.values()) {
          const found = useTabsetService().findTabInFolder([value as Tabset], tabId)
          // const found: Tab | undefined = _.find(value.tabs, t => {
          //   return t.id === tabId
          // })
          if (found && found.tab) {
            return new TabAndTabsetId(found.tab, value.id)
          }
        }
        return undefined
      }
    })

    const tabsetFor = computed(() => {
      return (tabId: string): Tabset | undefined => {
        for (const value of tabsets.value.values()) {
          if (_.find(value.tabs, (t: any) => t.id === tabId)) {
            return value as Tabset
          }
        }
        return undefined
      }
    })

    const tabsForUrl = computed((): (url: string) => TabAndTabsetId[] => {
      return (url: string) => {
        const tabsAndTabsetId: TabAndTabsetId[] = []
        forEach([...tabsets.value.values()] as Tabset[], (ts: Tabset) => {
          forEach(ts.tabs, (t: Tab) => {
            if (t.url === url) {
              tabsAndTabsetId.push(new TabAndTabsetId(t, ts.id))
            }
          })
        })
        return tabsAndTabsetId
      }
    })

    const allTabsCount = computed(() => {
      var count = 0
      for (const value of tabsets.value.values()) {
        const nr = value.tabs?.length
        count = count + nr
      }
      return count;
    })

    const rssTabs = computed(() => {
      const res: Tab[] = []
      _.forEach([...tabsets.value.values()] as Tabset[], (ts: Tabset) => {
        if (ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE) {
          _.forEach(ts.tabs, (t: Tab) => {
            if (t.url && t.url.endsWith(".rss")) {
              res.push(t)
            }
          })
        }
      })
      return res
    })

    const getAllUrls = (): string[] => {
      return _.map(
        _.flatMap(
          [...useTabsetsStore().tabsets.values()] as Tabset[],
          ((ts:Tabset) => ts.tabs)),
        (t: Tab) => t.url || '')
    }

    const  getActiveFolder = (root: Tabset, folderActive: string | undefined = root.folderActive):Tabset | undefined => {
      if (!folderActive) {
        return root
      }
      for(const f of root.folders) {
        if (f.id === folderActive) {
          return f
        } else {
          const subFolder = getActiveFolder(f, folderActive)
          if (subFolder) {
            return subFolder
          }
        }
      }
      return undefined
    }

    return {
      initialize,
      tabsets,
      createTabset,
      unsetCurrentTabset,
      addTabset,
      saveTabset, // check save vs add vs create
      setTabset,
      deleteTabset,
      selectCurrentTabset,
      getCurrentTabs,
      getCurrentTabset,
      currentTabsetName,
      currentTabsetId,
      tabForUrlInSelectedTabset,
      getTabset,
      existingInTabset,
      getTabAndTabsetId,
      tabsetFor,
      tabsForUrl,
      allTabsCount,
      rssTabs,
      getAllUrls,
      loadTabsets,
      getActiveFolder,
      share,
      reloadTabset
    }
  }
)
