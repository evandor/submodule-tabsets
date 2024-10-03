import {uid} from "quasar";
import _ from "lodash";
import {Tab, UrlExtension} from "src/tabsets/models/Tab";
import {Tabset, TabsetSharing, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import {STRIP_CHARS_IN_COLOR_INPUT, STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import PlaceholderUtils from "src/tabsets/utils/PlaceholderUtils";
import {ListDetailLevel} from "src/ui/stores/uiStore";
import {TabsetColumn} from "src/tabsets/models/TabsetColumn";
import {useContentService} from "src/content/services/ContentService";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {Space} from "src/spaces/models/Space";
import AppEventDispatcher from "src/app/AppEventDispatcher";
import {ContentItem} from "src/content/models/ContentItem";
import BrowserApi from "src/app/BrowserApi";

const {saveTabset, saveCurrentTabset, tabsetsFor, addToTabset} = useTabsetService()

// const {db} = useDB()
class TabsetService {

  setLocalStorage(localStorage: any) {
//    this.localStorage = localStorage;
  }

  async saveToCurrentTabset(tab: Tab, useIndex: number | undefined = undefined): Promise<Tabset> {
    const currentTs = useTabsetsStore().getCurrentTabset as Tabset | undefined
    if (currentTs) {
      return addToTabset(currentTs, tab, useIndex)
    }
    return Promise.reject("could not get current tabset")
  }

  isOpen(tabUrl: string): boolean {
    const tabsStore = useTabsStore2()
    return _.filter(tabsStore.browserTabs, (t: chrome.tabs.Tab) => {
      return t?.url === tabUrl
    }).length > 0
  }

  chromeTabIdFor(tabUrl: string): number | undefined {
    const tabsStore = useTabsStore2()
    const candidates = _.filter(tabsStore.browserTabs, (t: chrome.tabs.Tab) => t?.url === tabUrl)
    return candidates.length > 0 ? candidates[0].id : undefined
  }

  saveSelectedPendingTabs() {
    // this.saveAllPendingTabs(true)
  }

  setOnlySelectedTab(tab: Tab) {
    const currentTabset = useTabsetsStore().getCurrentTabset as Tabset | undefined
    if (currentTabset) {
      _.forEach(currentTabset.tabs, (t: Tab) => {
        //t.selected = t.id === tab.id;
      })
    }
  }

  // async getRequestFor(selectedTab: Tab): Promise<any> {
  //   if (selectedTab.url) {
  //     return this.getRequestForUrl(selectedTab.url)
  //   }
  //   return Promise.reject("url not provided");
  // }
  //
  // async getRequestForUrl(url: string): Promise<any> {
  //   return Promise.reject("not implemented")//db.getRequest(url)
  // }

  async getContentFor(selectedTab: Tab): Promise<ContentItem | undefined> {
    return this.getContentForUrl(selectedTab.id)
  }

  async getContentForUrl(tabId: string): Promise<ContentItem | undefined> {
    return useContentService().getContent(tabId)
  }


  async getMetaLinksFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.url) {
      return this.getMetaLinksForUrl(selectedTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getMetaLinksForUrl(url: string): Promise<any> {
    return Promise.reject("not implemented")//db.getMetaLinks(url)
  }

  async getLinksFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.url) {
      return this.getLinksForUrl(selectedTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getLinksForUrl(url: string): Promise<any> {
    return Promise.reject("not implemented") //db.getLinks(url)
  }

  setCustomTitle(tab: Tab, title: string, desc: string): Promise<any> {
    tab.name = title
    tab.longDescription = desc
    return saveCurrentTabset()
  }

  setColor(tab: Tab, color: string): Promise<any> {
    tab.color = color
    return saveCurrentTabset()
  }

  setMatcher(tab: Tab, matcher: string | undefined): Promise<any> {
    tab.matcher = matcher
    return saveCurrentTabset()
  }

  setUrl(
    tab: Tab,
    url: string,
    placeholders: string[] = [],
    placeholderValues: Map<string, string> = new Map(),
    extension: UrlExtension = UrlExtension.HTML
  ): Promise<any> {
    tab.url = url
    tab.extension = extension
    tab = PlaceholderUtils.apply(tab, placeholders, placeholderValues)
    return saveCurrentTabset()
  }

  moveToTabset(tabId: string, toTabsetId: string, copy: boolean = false): Promise<any> {
    const tabset = useTabsetsStore().tabsetFor(tabId)
    if (tabset) {
      const tabIndex = _.findIndex(tabset.tabs, {id: tabId})
      const targetTabset = useTabsetsStore().getTabset(toTabsetId)

      if (tabIndex >= 0 && targetTabset) {
        targetTabset.tabs.push(tabset.tabs[tabIndex])
        return saveTabset(targetTabset)
          .then(() => {
            if (copy) {
              let tabWithNewId = Object.assign({}, tabset.tabs[tabIndex])
              tabWithNewId['id'] = uid()
              console.log("copying", tabset.tabs[tabIndex], tabWithNewId)
              tabset.tabs.splice(tabIndex, 1, tabWithNewId)
            } else {
              console.log("not copying...")
              tabset.tabs.splice(tabIndex, 1)
            }
          })
          .then(() => saveTabset(tabset))
      } else {
        return Promise.reject("could not find tab/tabset " + tabId + "/" + toTabsetId)
      }
    }
    return Promise.reject("could not find tab " + tabId)
  }

  // ignoreTab(tab: Tab) {
  //   const tabsStore = useTabsStore()
  //   tabsStore.ignoredTabset.tabs.push(tab)
  //   const ignoredTS: Tabset = tabsStore.ignoredTabset as Tabset
  //   saveTabset(ignoredTS)
  // }

  exportData(exportAs: string, appVersion: string = "0.0.0"): Promise<any> {
    console.log("exporting as ", exportAs)

    const spacesStore = useSpacesStore()

    let data = ''
    let filename = 'tabsets.' + appVersion + '.json'
    if (exportAs === 'json') {
      const tabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]
      data = JSON.stringify({
        tabsets: tabsets.filter((ts: Tabset) => ts.status !== TabsetStatus.DELETED),
        spaces: [...spacesStore.spaces.values()]
      })
      return this.createFile(data, filename);
    } else if (exportAs === 'csv') {
      data = "not implemented yet"
      filename = "tabsets." + appVersion + ".csv"
      return this.createFile(data, filename);
    } else if (exportAs === 'bookmarks') {
      console.log("creating bookmarks...")

      chrome.bookmarks.getChildren("1", (results: chrome.bookmarks.BookmarkTreeNode[]) => {
        _.forEach(results, (r: any) => {
          if (r.title === "tabsetsBackup") {
            console.log("deleting folder", r.id)
            chrome.bookmarks.removeTree(r.id)
          }
        })
      })

      chrome.bookmarks.create({title: 'tabsetsBackup', parentId: '1'}, (result: chrome.bookmarks.BookmarkTreeNode) => {
        // console.log("res", result)
        _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
          console.log("ts", ts)
          chrome.bookmarks.create({
            title: ts.name,
            parentId: result.id
          }, (folder: chrome.bookmarks.BookmarkTreeNode) => {
            _.forEach(ts.tabs, (tab: Tab) => {
              chrome.bookmarks.create({
                title: tab.name || tab.title,
                parentId: folder.id,
                url: tab.url
              })
            })
          })
        })
      })

      // useBookmarksStore().loadBookmarks()
      //   .then(() => console.log("loaded in service"))

    }
    return Promise.resolve('done')
  }

  importData(json: string) {
    console.log("importing from json")
    let data = JSON.parse(json)
    let tabsets = data.tabsets || data
    let spaces = data.spaces || []

    _.forEach(spaces, (space: Space) => {
      useSpacesStore().addSpace(space)
    })

    _.forEach(tabsets, (tabset: Tabset) => {
      useTabsetsStore().addTabset(tabset)
      saveTabset(tabset)

      _.forEach(tabset.tabs, (tab: Tab) => {
        AppEventDispatcher.dispatchEvent('add-to-search', {
          id: tab.id,
          name: tab.title || '',
          title: tab.title || '',
          url: tab.url || '',
          description: tab.description,
          content: '',
          tabsets: [tabset.id],
          favIconUrl: tab.favIconUrl || ''
        })
      })
    })
  }

  createFile(data: string, filename: string) {
    const file = window.URL.createObjectURL(new Blob([data]));
    const docUrl = document.createElement('a');
    docUrl.href = file;
    docUrl.setAttribute('download', filename);
    document.body.appendChild(docUrl);
    docUrl.click();
    return Promise.resolve('done')
  }


  nameForTabsetId(tsId: string): string {
    return useTabsetsStore().tabsets.get(tsId)?.name || 'unknown'
  }

  async trackedTabsCount(): Promise<number> {
    if (!chrome.tabs) {
      return Promise.resolve(0)
    }
    // @ts-ignore
    const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
    let trackedTabs = 0
    _.forEach(result, (tab: chrome.tabs.Tab) => {
      if (tab && tab.url && tabsetsFor(tab.url).length > 0) {
        trackedTabs++
      }
    })
    return trackedTabs
  }

  async closeTrackedTabs(): Promise<chrome.tabs.Tab[]> {
    // TODO long-Running action
    const currentTab = await BrowserApi.getCurrentTab()

    // @ts-ignore
    const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
    const tabsToClose: chrome.tabs.Tab[] = []
    const tabsToKeep: chrome.tabs.Tab[] = []
    _.forEach(result, (tab: chrome.tabs.Tab) => {
      if (tab && tab.url && tab.url !== currentTab.url && tabsetsFor(tab.url).length > 0) {
        tabsToClose.push(tab)
      } else {
        tabsToKeep.push(tab)
      }
    })
    // console.log("tabsToClose", tabsToClose)
    _.forEach(tabsToClose, (t: chrome.tabs.Tab) => {
      if (t.id) {
        chrome.tabs.remove(t.id)
      }
    })
    return Promise.resolve(tabsToKeep)
  }

  async closeAllTabs() {
    // TODO long-Running action
    //ChromeApi.closeAllTabs()
  }

  /**
   * renames a tabset identified by its id with the new name. The old name
   * is returned.
   *
   * @param tabsetId
   * @param tabsetName
   */
  rename(tabsetId: string, tabsetName: string, newColor: string | undefined, window: string = 'current', details: ListDetailLevel = ListDetailLevel.MAXIMAL): Promise<object> {
    const trustedName = tabsetName.replace(STRIP_CHARS_IN_USER_INPUT, '')
    let trustedColor = newColor ? newColor.replace(STRIP_CHARS_IN_COLOR_INPUT, '') : undefined
    trustedColor = trustedColor && trustedColor.length > 20 ?
      trustedColor?.substring(0, 19) :
      trustedColor

    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      const oldName = tabset.name
      const oldColor = tabset.color
      tabset.name = trustedName
      tabset.color = trustedColor
      tabset.window = window
      tabset.details = details
      //console.log("saving tabset", tabset)
      return saveTabset(tabset)
        .then(() => Promise.resolve({
          oldName: oldName,
          oldColor: oldColor
        }))
    }
    return Promise.reject("could not find tabset for id " + tabsetId)
  }

  canvasPosition(tabsetId: string, tabsetName: string) {
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      tabset.name = tabsetName
      saveTabset(tabset)
    }
  }

  async moveTo(tabId: string, newIndex: number, column: TabsetColumn) {
    console.log(`moving tabId ${tabId} to new index ${newIndex} with columnId ${column.id}`)
    const currentTabset = useTabsetsStore().getCurrentTabset!
    const activeFolder = useTabsetsStore().getActiveFolder(currentTabset)
    let tabs = activeFolder ? activeFolder.tabs : currentTabset.tabs
    console.log("tabs before", _.map(tabs, (t: any) => t.url))
    //tabs = _.filter(tabs, (t: Tab) => t.columnId === column.id)
    const oldIndex = _.findIndex(tabs, (t: any) => t.id === tabId)
    if (oldIndex >= 0) {
      console.log("found old index", oldIndex)
      const tab = tabs.splice(oldIndex, 1)[0];
      tabs.splice(newIndex, 0, tab);

      // Sharing
      if (currentTabset.sharedId && currentTabset.sharing === TabsetSharing.PUBLIC_LINK) {
        currentTabset.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
      }

      await saveCurrentTabset()
    }
  }

  setView(tabsetId: string, view: string) {
    console.log("setting view", tabsetId, view)
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      tabset.view = view
      saveTabset(tabset)
    }
  }

  toggleSorting(tabsetId: string): string | undefined {
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      switch (tabset.sorting) {
        case 'custom':
          tabset.sorting = 'alphabeticalUrl';
          break;
        case 'alphabeticalUrl':
          tabset.sorting = 'alphabeticalTitle';
          break;
        case 'alphabeticalTitle':
          tabset.sorting = 'custom';
          break;
        default:
          tabset.sorting = 'custom'
      }
      saveTabset(tabset)
      return tabset.sorting
    }
    return undefined
  }

  // setPosition(tabId: string, top: number, left: number) {
  //   const tab = _.find(getCurrentTabset()?.tabs, t => t.id === tabId)
  //   if (tab) {
  //     tab.canvasLeft = left
  //     tab.canvasTop = top
  //     saveCurrentTabset()
  //       .catch((err) => console.error("problem saving tabset", err))
  //   } else {
  //     console.log("warning: could not set position for", tabId)
  //   }
  // }
  //
  // saveCanvasLayer(tabsetId: string, layerInfo: string) {
  //   const tabset = getTabset(tabsetId)
  //   if (tabset) {
  //     tabset.canvas = layerInfo
  //     saveTabset(tabset)
  //   } else {
  //     console.log("warning: could not set save canvas for", tabsetId)
  //   }
  // }

  saveNote(tabId: string, note: string, scheduledFor: Date | undefined): Promise<void> {
    // console.log("got", tabId, note)
    const tab = _.find(useTabsetsStore().getCurrentTabset?.tabs, (t: Tab) => t.id === tabId) as Tab | undefined
    if (tab) {
      tab.note = note
      if (scheduledFor) {
        tab.scheduledFor = scheduledFor.getTime()
      }
      if (tab.url) {
        // TODO
        //useSearchStore().update(tab.url, 'note', note)
      }
      return saveCurrentTabset()
    }
    return Promise.reject("did not find tab with id " + tabId)
  }

  // markAsDeleted(tabsetId: string): Promise<Tabset> {
  //   debugger
  //   const ts = useTabsetsStore().getTabset(tabsetId)
  //   if (ts) {
  //     ts.status = TabsetStatus.DELETED
  //     return saveTabset(ts)
  //       .then(() => {
  //         if (useTabsetsStore().getCurrentTabset?.id === tabsetId) {
  //           useTabsetsStore().unsetCurrentTabset()
  //         }
  //         return ts
  //       })
  //   }
  //   return Promise.reject("could not mark as deleted: " + tabsetId)
  // }

  markAs(tabsetId: string, status: TabsetStatus, type: TabsetType = TabsetType.DEFAULT): Promise<TabsetStatus> {
    console.debug(`marking ${tabsetId} as ${status}`)
    const ts = useTabsetsStore().getTabset(tabsetId)
    if (ts) {
      const oldStatus = ts.status
      ts.status = status
      ts.type = type
      return saveTabset(ts)
        .then(() => oldStatus)
    }
    return Promise.reject("could not change status : " + tabsetId)
  }

  share(tabsetId: string, sharing: TabsetSharing, sharedId: string | undefined, sharedBy: string) {
    const tabset = useTabsetsStore().getTabset(tabsetId)!
    return useTabsetsStore().share(tabset, sharing, sharedId, sharedBy)
  }
}

export default new TabsetService();
