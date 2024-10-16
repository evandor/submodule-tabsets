import {STRIP_CHARS_IN_COLOR_INPUT, STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {Tab} from "src/tabsets/models/Tab";
import _ from "lodash";
import {uid} from "quasar";
import ChromeApi from "src/app/BrowserApi";
import {TabPredicate} from "src/domain/Types";
import {Tabset, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import {MetaLink} from "src/models/MetaLink";
// @ts-ignore
import {v5 as uuidv5} from 'uuid';
import {useSettingsStore} from "src/stores/settingsStore"
import {SaveOrReplaceResult} from "src/tabsets/models/SaveOrReplaceResult";
import JsUtils from "src/utils/JsUtils";
import {useUiStore} from "src/ui/stores/uiStore";
import {TabInFolder} from "src/tabsets/models/TabInFolder";
import {useContentService} from "src/content/services/ContentService";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import AppEventDispatcher from "src/app/AppEventDispatcher";
import throttledQueue from "throttled-queue";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {GithubLogCommand} from "src/tabsets/commands/github/GithubLogCommand";

// let db: TabsetsPersistence = null as unknown as TabsetsPersistence

export function useTabsetService() {

  const init = async (doNotInitSearchIndex: boolean = false) => {

    function selectFirstAvailableTabset() {
      const ts = [...useTabsetsStore().tabsets.values()] as Tabset[]
      if (ts.length > 0) {
        useTabsetsStore().selectCurrentTabset(ts[0].id)
      }
    }

    console.debug(" ...initializing tabsetService2 as (TODO)")
    await useTabsetsStore().loadTabsets()
    const selectedTabsetId = localStorage.getItem("selectedTabset")
    if (selectedTabsetId) {
      console.debug(` ...config: setting selected tabset from storage: ${selectedTabsetId}`)
      const selectedTabset = useTabsetsStore().selectCurrentTabset(selectedTabsetId)
      if (!selectedTabset) {
        selectFirstAvailableTabset()
      }
    } else {
      selectFirstAvailableTabset()
    }
  }

  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided Chrome tabs.
   *
   * Use case: https://skysail.atlassian.net/wiki/spaces/TAB/pages/807927852/Creating+a+Tabset
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   * If merge is false, potentially existing tabs will be removed first.
   *
   * @param name the tabset's name
   * @param chromeTabs an array of Chrome tabs
   * @param merge if true, the old values (if existent) and the new ones will be merged.
   * @param type
   */
  const saveOrReplaceFromChromeTabs = async (
    name: string,
    chromeTabs: chrome.tabs.Tab[],
    merge: boolean = false,
    windowId: string = 'current',
    tsType: TabsetType = TabsetType.DEFAULT,
    color: string | undefined = undefined,
    dynamicSource: string | undefined = undefined,
    spaceId: string | undefined = undefined
  ): Promise<SaveOrReplaceResult> => {
    const trustedName = name.replace(STRIP_CHARS_IN_USER_INPUT, '')
      .substring(0, 31)
    const trustedColor = color ?
      color.replace(STRIP_CHARS_IN_COLOR_INPUT, '').substring(0, 31)
      : undefined
    const tabs: Tab[] = _.filter(
      _.map(chromeTabs, (t: chrome.tabs.Tab) => {
        const tab = new Tab(uid(), t)
        tab.tags.push(name)
        return tab
      }),
      (t: Tab) => {
        if (!useSettingsStore().isEnabled('extensionsAsTabs')) {
          return !t.url?.startsWith("chrome-extension://")
        }
        return true
      })
    try {
      const dynUrl = dynamicSource ? new URL(dynamicSource) : undefined
      const tabset = await useTabsetsStore().createTabset(trustedName, tabs, trustedColor, dynUrl, spaceId)


      //await saveTabset(result.tabset)
      // result.tabset.tabs.forEach((tab: Tab) => {
      //   console.info(tab, "created tab")
      // })
      selectTabset(tabset.id)
      //useSearchStore().indexTabs(tabset.id, tabs)
      useTabsetService().addToSearchIndex(tabset.id, tabs)
      return new SaveOrReplaceResult(false, tabset, false)
    } catch (err) {
      return Promise.reject("problem updating or creating tabset: " + err)
    }
  }

  const copyFromTabset = async (tabset: Tabset, spaceId: string | undefined = undefined): Promise<object> => {

    function nameFrom(name: string): string {
      const nameCandidate = name + " - Copy"
      const existsAlready = useTabsetsStore().existingInTabset(nameCandidate, spaceId)
      return existsAlready ? nameFrom(nameCandidate) : nameCandidate.replace(STRIP_CHARS_IN_USER_INPUT, '')
    }

    const copyName = nameFrom(tabset.name)
    try {
      const tabsetCopy = await useTabsetsStore().createTabset(copyName, tabset.tabs)
      if (spaceId) {
        tabset.spaces = [spaceId]
      } else {
        tabset.spaces = []
      }
      await saveTabset(tabsetCopy)
      selectTabset(tabsetCopy.id)
      //useSearchStore().indexTabs(tabsetCopy.id, tabsetCopy.tabs)
      return {
        replaced: false,
        tabset: tabsetCopy,
        merged: false
      }
    } catch (err) {
      return Promise.reject("problem copying tabset: " + err)
    }
  }

  // @ts-ignore
  const getOrCreateSpecialTabset = async (ident: SpecialTabsetIdent, type: TabsetType): Tabset => {
    // const result: Tabset = await useTabsStore().getOrCreateSpecialTabset(ident, type)
    // await saveTabset(result)
    return null as unknown as Tabset// result
  }

  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided bookmarks.
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   *
   * @param name the tabset's name (TODO: validation)
   * @param bms an array of Chrome bookmarks.
   * @param merge if true, the old values and the new ones will be merged.
   */
  const saveOrReplaceFromBookmarks = async (name: string, bms: chrome.bookmarks.BookmarkTreeNode[], merge: boolean = false, dryRun = false): Promise<object> => {
    const now = new Date().getTime()
    const tabs = _.map(_.filter(bms, (bm: any) => bm.url !== undefined), (c: any) => {
      const tab = new Tab(uid(), ChromeApi.createChromeTabObject(c.title, c.url || '', ""))
      tab.bookmarkUrl = c.url
      tab.bookmarkId = c.id
      tab.created = c.dateAdded || 0
      tab.updated = now
      return tab
    })

    const tabset = await useTabsetsStore().createTabset(name, tabs)
    if (!dryRun) {
      await saveTabset(tabset)
      selectTabset(tabset.id)
    }
    return {
      tabsetId: tabset.id,
      replaced: false,
      merged: false,
      updated: now,
      tabset: tabset
    }
  }

  const reloadTabset = async (tabsetId: string) => {
    useTabsetsStore().reloadTabset(tabsetId)
  }

  const resetSelectedTabs = () => {
    // const currentTabset = getCurrentTabset()
    // if (currentTabset) {
    //   _.forEach(currentTabset.tabs, (t: Tab) => t.selected = false)
    // }
    // useNotificationsStore().setSelectedTab(null as unknown as Tab)
  }

  const selectTabset = (tabsetId: string | undefined): void => {
    console.debug("selecting tabset", tabsetId)
    resetSelectedTabs()
    if (tabsetId) {
      useTabsetsStore().selectCurrentTabset(tabsetId)
    }
    //tabsStore.currentTabsetId = tabsetId || null as unknown as string;
    ChromeApi.buildContextMenu("tabsetService 230")
    if (tabsetId) {
      localStorage.setItem("selectedTabset", tabsetId)
    } else {
      localStorage.removeItem("selectedTabset")
    }
  }

  const deleteTabset = async (tabsetId: string): Promise<string> => {
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      _.forEach(useTabsetsStore().getTabset(tabsetId)?.tabs, (t: Tab) => {
        console.debug(t, "removing thumbnails")
        AppEventDispatcher.dispatchEvent('remove-captured-screenshot', {
          tabId: t.id
        })
        //useThumbnailsService().removeThumbnailsFor(t.id)
      })

      await useTabsetsStore().deleteTabset(tabsetId)

      //await db.deleteTabset(tabsetId)

      //this.db.delete('tabsets', tabsetId)
      const nextKey: string | undefined = useTabsetsStore().tabsets.keys().next().value
      console.log("setting next key to", nextKey)
      selectTabset(nextKey)
      return Promise.resolve("ok")
    }
    return Promise.reject("could not get tabset for id")
  }

  const deleteTabsetDescription = (tabsetId: string): Promise<string> => {
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      tabset.page = undefined
      useTabsetService().saveTabset(tabset)
      return Promise.resolve("done")
    }
    return Promise.reject("could not get tabset for id")
  }

  const deleteTabsetFolder = (tabset: Tabset, folder: Tabset): Promise<string> => {
    removeFolder(tabset, folder.id)
    tabset.folderActive = undefined
    useTabsetService().saveTabset(tabset)
    return Promise.resolve("done")
  }

  const deleteFromTabset = (tabsetId: any, predicate: TabPredicate): Promise<number> => {
    console.log("deleting from tabset")
    const ts = useTabsetsStore().getTabset(tabsetId)
    if (ts) {
      const tabsCount = ts.tabs.length
      const tabsToKeep: Tab[] = _.filter(ts.tabs, (t: Tab) => !predicate(t))
      console.debug("found tabsToKeep", tabsToKeep)
      ts.tabs = tabsToKeep
      return saveTabset(ts)
        .then((res) => tabsCount - tabsToKeep.length)
    }
    return Promise.reject("did not find tabset for id " + tabsetId)

  }

  const rootTabsetFor = (ts: Tabset | undefined): Tabset | undefined => {
    if (!ts) {
      return undefined
    }
    if (ts.folderParent) {
      return rootTabsetFor(useTabsetsStore().getTabset(ts.folderParent))
    }
    return ts
  }

  const saveTabset = async (tabset: Tabset): Promise<any> => {
    if (tabset.id) {
      tabset.updated = new Date().getTime()
      // seems necessary !?
      if (!tabset.type) {
        tabset.type = TabsetType.DEFAULT
      }
      const rootTabset = rootTabsetFor(tabset)
      console.debug(`saving (sub-)tabset '${tabset.name}' with ${tabset.tabs.length} tab(s) at id ${rootTabset?.id}`)
      if (rootTabset) {

        // TODO in progress: NEW APPROACH
        return await useTabsetsStore().saveTabset(rootTabset)

        //return db.saveTabset(rootTabset)
      }
    }
    return Promise.reject("tabset id not set")
  }

  const addToTabsetId = async (tsId: string, tab: Tab, useIndex: number | undefined = undefined): Promise<Tabset> => {
    const ts = useTabsetsStore().getTabset(tsId)
    if (ts) {
      return addToTabset(ts, tab, useIndex)
    }
    return Promise.reject("no tabset for given id " + tsId)
  }


  const saveCurrentTabset = async (): Promise<any> => {
    const currentTabset = useTabsetsStore().getCurrentTabset as Tabset | undefined
    if (currentTabset) {
      return await saveTabset(currentTabset)
    }
    return Promise.reject("current tabset could not be found")
  }

  /**
   * called when we have a text excerpt (and meta data) from the background script.
   *
   * The data (text & meta) will be saved in the content db with an identifier derived from
   * the url - this data will be saved even if there is no tab for this url yet.
   *
   * Then, all existing tabs for the same url will be updated with the new data.
   *
   * @param tab
   * @param text
   * @param metas
   */
  const saveText = (tab: Tab | undefined, text: string, metas: object = {}): Promise<any> => {
    if (!tab || !tab.url) {
      return Promise.resolve('done')
    }
    console.debug("saving text for", tab.id, tab.url, metas)
    const title = tab.title || ''
    const tabsetIds: string[] = tabsetsFor(tab.url)

    useContentService().saveContent(tab.id, text, metas, title, tabsetIds)
      .catch((err: any) => console.log("err", err))

    const tabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]

    const savePromises: Promise<any>[] = []

    // iterate all tabsets and update meta data for given url
    tabsets.forEach((tabset: Tabset) => {
      if (tabset) {
        _.forEach(tabset.tabs, (t: Tab) => {
          //console.log("comparing", t.url, tab.url)
          if (t.url === tab.url) {
            if (metas && metas['description' as keyof object]) {
              t.description = metas['description' as keyof object]
              // @ts-ignore
              // TODO
              //useSearchStore().update(tab.url, 'description', t.description)
            }
            if (metas && metas['tabsets:longDescription' as keyof object]) {
              t.longDescription = metas['tabsets:longDescription' as keyof object]
            }
            if (metas && metas['keywords' as keyof object]) {
              t.keywords = metas['keywords' as keyof object]
              if (t.keywords) {
                const blankSeparated = t.keywords.split(" ")
                const commaSeparated = t.keywords.split(",")
                const splits = (t.keywords.indexOf(",") >= 0) ? commaSeparated : blankSeparated
                if (!t.tags) {
                  t.tags = []
                }
                t.tags = t.tags.concat(_.union(_.filter(_.map(splits, (split: any) => split.trim()), (split: string) => split.length > 0)))
              }
            }
            const author = getIfAvailable(metas, 'author')
            if (author) {
              t.author = author
            }
            const lastModified = getIfAvailable(metas, 'last-modified')
            if (lastModified) {
              t.lastModified = lastModified
            }
            const date = getIfAvailable(metas, 'date')
            if (date) {
              t.date = date
            }
            const image = getIfAvailable(metas, 'image')
            if (image) {
              t.image = image
            }

            if (text && text.length > 0) {
              t.contentHash = uuidv5(text, 'da42d8e8-2afd-446f-b72e-8b437aa03e46')
            } else {
              t.contentHash = ""
            }
            savePromises.push(saveTabset(tabset))
          }
        })
      }
    })

    return Promise.all(savePromises)
  }

  const saveMetaLinksFor = (tab: chrome.tabs.Tab, metaLinks: MetaLink[]) => {
    if (tab && tab.url) {
      // db.saveMetaLinks(tab.url, metaLinks)
      //   //.then(() => console.debug("added meta links"))
      //   .catch(err => console.log("err", err))
    }
  }

  const saveLinksFor = (tab: chrome.tabs.Tab, links: any) => {
    if (tab && tab.url) {
      // db.saveLinks(tab.url, links)
      //   //.then(() => console.debug("added links"))
      //   .catch(err => console.log("err", err))
    }
  }


  const tabsetsFor = (url: string): string[] => {
    const tabsets: string[] = []
    for (let ts of [...useTabsetsStore().tabsets.values()]) {
      if (ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE) {
        if (_.find(ts.tabs, (t: any) => t.url === url)) {
          tabsets.push(ts.id)
        }
      }
    }
    return tabsets;
  }

  const exportDataAsJson = () => {
    const tabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]
    return JSON.stringify({
      tabsets: tabsets.filter((ts: Tabset) => ts.status !== TabsetStatus.DELETED),
      spaces: [...useSpacesStore().spaces.values()]
    }, null, 2)
  }

  /**
   * adds the (new) Tab 'tab' to the tabset given in 'ts' (- but does not persist to db).
   *
   * proceeds only if tab.url exists and the tab is not already contained in the tabset.
   *
   * @param ts
   * @param tab
   * @param useIndex
   */
  const addToTabset = async (ts: Tabset, tab: Tab, useIndex: number | undefined = undefined): Promise<Tabset> => {
    if (tab.url) {
      const indexInTabset = _.findIndex(ts.tabs, (t: any) => t.url === tab.url)
      if (indexInTabset >= 0 && !tab.image) {
        return Promise.reject("tab exists already")
      }

      // add tabset's name to tab's tags
      tab.tags.push(ts.name)
      try {
        tab.tags.push(new URL(tab.url).hostname.replace("www.", ""))
      } catch (err) {
      }

      if (useIndex !== undefined && useIndex >= 0) {
        ts.tabs.splice(useIndex, 0, tab)
      } else {
        ts.tabs.push(tab)
      }

      useCommandExecutor().execute(new GithubLogCommand('newTab', tab as object))
        .catch((err) => console.warn(err))

      return Promise.resolve(ts)
    }
    return Promise.reject("tab.url undefined")
  }

  const saveBlob = (tab: chrome.tabs.Tab | undefined, blob: Blob): Promise<string> => {
    // if (tab && tab.url) {
    //   const id: string = uid()
    //   return db.saveBlob(id, tab.url, blob, BlobType.PNG, '')
    //     .then(() => Promise.resolve(id))
    //     .catch(err => Promise.reject(err))
    // }
    return Promise.reject("no tab or tab url")
  }

  const getBlob = (blobId: string): Promise<any> => {
    return Promise.reject("not implemented")//db.getBlob(blobId)
  }

  // const saveRequestFor = (url: string, requestInfo: RequestInfo) => {
  //   if (url) {
  //     db.saveRequest(url, requestInfo)
  //       .then(() => console.debug("added request"))
  //       .catch(err => console.log("err", err))
  //   }
  // }

  const removeContentFor = (tabId: string): Promise<any> => {
    return useContentService().deleteContent(tabId)
  }

  const deleteTab = (tab: Tab, tabset: Tabset): Promise<Tabset> => {
    console.log("deleting tab", tab)//.id, tab.chromeTabId, tabset.id)
    const tabUrl = tab.url || ''
    if (tabsetsFor(tabUrl).length <= 1) {

      AppEventDispatcher.dispatchEvent('remove-captured-screenshot', {
        tabId: tab.id
      })
      // useThumbnailsService().removeThumbnailsFor(tab.id)
      //  .then(() => console.debug("deleting thumbnail for ", tabUrl))
      //  .catch(err => console.log("error deleting thumbnail", err))

      removeContentFor(tab.id)
        .then(() => console.debug("deleting content for ", tab.id))
        .catch(err => console.log("error deleting content", err))
    }
    useTabsStore2().removeTab(tabset, tab.id)
    console.log("deletion: saving tabset", tabset)
    return saveTabset(tabset)
      .then(() => tabset)
  }

  const getIfAvailable = (metas: object, key: string): string | undefined => {
    let res = undefined
    _.forEach(Object.keys(metas), (k: any) => {
      const value = metas[k as keyof object] as string
      if (k.endsWith(key) && value && value.trim().length > 0) {
        //console.log("k>", k, value)
        res = value
      }
    })
    return res
  }

  const urlExistsInATabset = (url: string): boolean => {
    for (let ts of [...useTabsetsStore().tabsets.values()]) {
      if (_.find(ts.tabs, (t: any) => t.url === url)) {
        return true;
      }
    }
    return false;
  }
  const urlExistsInCurrentTabset = (url: string | undefined): boolean => {
    const currentTabset = useTabsetsStore().getCurrentTabset
    // console.log("testing exists in current tabset", currentTabset.id, url)
    if (currentTabset && url) {
      if (_.find(currentTabset.tabs, (t: any) => {
        return (t.matcher) ?
          JsUtils.match(t.matcher, url) :
          t.url === url
      })) {
        return true
      }
    }
    return false;
  }

  const urlWasActivated = (url: string): void => {
    _.forEach([...useTabsetsStore().tabsets.keys()], (key: string) => {
      const ts = useTabsetsStore().tabsets.get(key)
      if (ts && ts.status !== TabsetStatus.DELETED) {
        // increasing hit count
        const hits = _.filter(ts.tabs, (t: Tab) => t.url === url) as Tab[]
        let hit = false
        _.forEach(hits, (h: Tab) => {
          h.activatedCount = 1 + h.activatedCount
          h.lastActive = new Date().getTime()
          hit = true
        })
        if (hit) {
          console.debug("saving tabset on activated", ts.name)
          saveTabset(ts as Tabset)
        }
      }
    })
  }

  const tabsToShow = (tabset: Tabset): Tab[] => {

    let tabs: Tab[] = tabset.tabs


    // TODO order??
    const filter = useUiStore().tabsFilter
    if (!filter || filter.trim() === '') {
      return tabs
    }
    return _.filter(tabs, (t: Tab) => {
      return (t.url || '')?.indexOf(filter) >= 0 ||
        (t.title || '')?.indexOf(filter) >= 0 ||
        t.description?.indexOf(filter) >= 0
    })
  }

  // const findFolder = (folders: Tabset[], folderId: string): Tabset | undefined => {
  //   for (const f of folders) {
  //     if (f.id === folderId) {
  //       //console.log("found active folder", f)
  //       return f
  //     }
  //     const optionalFound = findFolder(f.folders, folderId)
  //
  //     if (optionalFound) {
  //       return optionalFound
  //     }
  //   }
  //   return undefined
  // }

  const removeFolder = (root: Tabset, folderId: string): void => {
    root.folders = _.filter(root.folders, (f: any) => f.id !== folderId)
    for (const f of root.folders) {
      removeFolder(f, folderId)
    }
  }

  const findTabInFolder = (folders: Tabset[], tabId: string): TabInFolder | undefined => {
    for (const f of folders) {
      for (const t of f.tabs) {
        if (t.id === tabId) {
          return new TabInFolder(t, f)
        }
      }
    }
    for (const f of folders) {
      if (f.folders) {
        return findTabInFolder(f.folders, tabId)
      }
    }
    return undefined
  }

  // TODO make command
  const moveTabToFolder = (tabset: Tabset, tabIdToDrag: string, moveToFolderId: string) => {
    console.log(`moving tab ${tabIdToDrag} to folder ${moveToFolderId} in tabset ${tabset.id}`)
    const tabWithFolder = findTabInFolder([tabset], tabIdToDrag)
    console.log("found tabWithFolder", tabWithFolder)
    //const newParentFolder = findFolder([tabset], moveToFolderId)
    const newParentFolder = useTabsetsStore().getActiveFolder(tabset, moveToFolderId)
    if (newParentFolder && tabWithFolder) {
      console.log("newParentFolder", newParentFolder)
      newParentFolder.tabs.push(tabWithFolder.tab)
      saveTabset(tabset).then(() => {
        tabWithFolder.folder.tabs = _.filter(tabWithFolder.folder.tabs, (t: any) => t.id !== tabIdToDrag)
        saveTabset(tabset)
      })
    }
  }

  const populateSearch = async () => {

    //const urlSet: Set<string> = new Set()
    const minimalIndex: object[] = []

    for (const tabset of [...useTabsetsStore().tabsets.values()] as Tabset[]) {
      for (const tab of tabset.tabs) {
        if (!tab.url) {
          continue
        }
        if (typeof (tab.id) === 'number') {
          console.log("tab.id", tab.id, typeof (tab.id))

        }
        // if (urlSet.has(tab.url)) {
        //   const existingDocIndex = _.findIndex(minimalIndex, (d: any) => {
        //     return d.url === tab.title
        //   })
        //   if (existingDocIndex >= 0) {
        //     const existingDoc = minimalIndex[existingDocIndex]
        //     // console.log("existingDoc", existingDoc)
        //     if ((existingDoc['tabsets' as keyof object] as string[]).indexOf(tabset.id) < 0) {
        //       const newTabsetIds = (existingDoc['tabsets' as keyof object] as string[]).concat([tabset.id])
        //       //@ts-ignore
        //       existingDoc['tabsets'] = newTabsetIds
        //       minimalIndex.splice(existingDocIndex, 1, existingDoc)
        //     }
        //   } else {
        //     //const doc = new SearchDoc(uid(), tab.name || '', tab.title || '', tab.url, "", "", "", [tabset.id], '', "")
        //     minimalIndex.push({
        //       name: tab.name || '',
        //       title: tab.title || '',
        //       url: tab.url || '',
        //       description: tab.description,
        //       content: '',
        //       tabsets: [tabset.id],
        //       favIconUrl: tab.favIconUrl || '',
        //       tags: tab.tags ? tab.tags.join(' ') : ''
        //     })
        //   }
        // } else {
        const content = await useContentService().getContent(tab.id)
        const addToIndex = {
          name: tab.name || '',
          title: tab.title || '',
          url: tab.url || '',
          description: tab.description,
          content: content?.content || '',
          tabsets: [tabset.id],
          favIconUrl: tab.favIconUrl || '',
          tags: tab.tags ? tab.tags.join(' ') : ''
        }
        //console.log("adding to index: ", addToIndex)
        minimalIndex.push(addToIndex)
        // AppEventDispatcher.dispatchEvent('upsert-in-search', addToIndex)
        // urlSet.add(tab.url)
        // }
      }
    }

    console.debug(` ...populating search index from tabsets with ${minimalIndex.length} entries`)
    const perInterval = 250
    const throttleRequests = throttledQueue(perInterval, 1000, true)

    const promises: Promise<any>[] = []
    let index = 0
    minimalIndex.forEach((doc: object) => {
      const p = throttleRequests(async () => {
        const progress = Math.round(100 * (1.1 * (perInterval * index / minimalIndex.length) + index++) / minimalIndex.length) / 100
        useUiStore().setProgress(progress, "indexing search...")
        AppEventDispatcher.dispatchEvent('upsert-in-search', doc)
        return Promise.resolve("")
      })
      promises.push(p)
    })
    Promise.all(promises).finally(() => useUiStore().stopProgress())
  }

  const addToSearchIndex = (tsId: string, tabs: Tab[]) => {
    const minimalIndex: object[] = []
    const urlSet: Set<string> = new Set()
    tabs.forEach((tab: Tab) => {
      if (tab.url) {
        if (!urlSet.has(tab.url)) {
          //const doc = new SearchDoc("", "", tab.title || '', tab.url, "", "", "", [tsId], '', "")
          minimalIndex.push({
            name: tab.name || '',
            title: tab.title || '',
            url: tab.url || '',
            description: tab.description,
            content: '',
            tabsets: [tsId],
            favIconUrl: tab.favIconUrl || '',
            tags: tab.tags.join(' ')
          })
          urlSet.add(tab.url)
        }
      }
    })
    // if (fuse.value) {
    //   minimalIndex.forEach((doc: SearchDoc) => fuse.value.add(doc))
    // }
    minimalIndex.forEach(e => {
      AppEventDispatcher.dispatchEvent('add-to-search', e)
    })
  }


  return {
    init,
    saveOrReplaceFromChromeTabs,
    saveOrReplaceFromBookmarks,
    copyFromTabset,
    deleteFromTabset,
    deleteTabset,
    selectTabset,
    saveTabset,
    saveCurrentTabset,
    saveText,
    saveMetaLinksFor,
    saveLinksFor,
    addToTabsetId,
    addToTabset,
    tabsetsFor,
    removeContentFor,
    deleteTab,
    urlExistsInATabset,
    urlExistsInCurrentTabset,
    getOrCreateSpecialTabset,
    saveBlob,
    getBlob,
    reloadTabset,
    //handleAnnotationMessage,
    tabsToShow,
    deleteTabsetDescription,
    findTabInFolder,
    moveTabToFolder,
    deleteTabsetFolder,
    urlWasActivated,
    populateSearch,
    addToSearchIndex,
    exportDataAsJson
  }

}
