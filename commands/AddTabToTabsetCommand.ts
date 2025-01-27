// 6 expected diffs to localstorage
// 6 expected diffs to localstorage
import { doc, setDoc } from 'firebase/firestore'
import _ from 'lodash'
import { uid } from 'quasar'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useContentStore } from 'src/content/stores/contentStore'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useUtils } from 'src/core/services/Utils'
import ContentUtils from 'src/core/utils/ContentUtils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useRequestsService } from 'src/requests/services/RequestsService'
import { useRequestsStore } from 'src/requests/stores/requestsStore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { useLogger } from 'src/services/Logger'
import { Tab } from 'src/tabsets/models/Tab'
import { ChangeInfo, Tabset, TabsetSharing } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useGroupsStore } from 'src/tabsets/stores/groupsStore'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import PlaceholderUtils from 'src/tabsets/utils/PlaceholderUtils'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { useAuthStore } from 'stores/authStore'

const { sendMsg } = useUtils()
const { info } = useLogger()

// No undo command, tab can be deleted manually easily

/**
 * Add provided Tab to provided Tabset.
 */
export class AddTabToTabsetCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public tabset: Tabset | undefined = undefined,
    public activeFolder: string | undefined = undefined,
    public allowDuplicates: boolean = false,
    public ignoreDuplicates: boolean = false,
  ) {
    if (!tabset) {
      this.tabset = useTabsetsStore().getCurrentTabset
    }
    if (!this.tabset) {
      throw new Error('could not set current tabset')
    }
  }

  async execute(): Promise<ExecutionResult<any>> {
    //console.info(`adding tab '${this.tab.id}' to tabset '${this.tabset!.id}', active folder: ${this.activeFolder}`)

    let tabsetOrFolder = this.tabset!
    if (this.activeFolder) {
      //const folder = useTabsetService().findFolder(this.tabset!.folders, this.activeFolder)
      const folder = useTabsetsStore().getActiveFolder(this.tabset!, this.activeFolder)
      if (folder) {
        tabsetOrFolder = folder
      }
    }

    if (!this.allowDuplicates) {
      const exists = _.findIndex(tabsetOrFolder.tabs, (t: any) => t.url === this.tab.url) >= 0
      //console.debug("checking 'tab exists' yields", exists)
      if (exists && !this.ignoreDuplicates) {
        return Promise.reject('tab already exists in this tabset')
      } else if (exists) {
        return Promise.resolve(new ExecutionResult('', ''))
      }
    }

    try {
      // manage (chrome) Group
      // console.log('updating tab group for group id', this.tab.groupId)
      const currentGroup = useGroupsStore().currentGroupForId(this.tab.groupId)
      this.tab.groupName = currentGroup?.title || undefined
      if (currentGroup) {
        await useGroupsStore().persistGroup(currentGroup)
      }

      // TabReferences
      this.tab.tabReferences = useContentStore().currentTabReferences

      // Article (ReaderMode)
      if (useFeaturesStore().hasFeature(FeatureIdent.READING_MODE)) {
        const article = useContentStore().currentTabArticle
        if (article && article['title' as keyof object] && article['textContent' as keyof object]) {
          const content: string = article['textContent' as keyof object]
          if (content.length > 500) {
            this.tab.tabReferences.push(
              new TabReference(
                uid(),
                TabReferenceType.READING_MODE,
                article['title' as keyof object],
                [article],
                this.tab.url,
              ),
            )
            //this.tab.url = chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${this.tab.id}`)
            useContentStore().resetCurrentTabArticle()
          }
        }
      }

      const tabset: Tabset = await useTabsetService().addToTabset(tabsetOrFolder, this.tab, 0, this.allowDuplicates)

      // Analysis not needed, remove
      if (useAuthStore().user.uid && this.tab.url?.startsWith('https://')) {
        const userId = useAuthStore().user.uid
        setDoc(doc(FirebaseServices.getFirestore(), 'users', userId, 'queue', uid()), {
          event: 'new-tab',
          url: this.tab.url,
        })
      }

      // Sharing
      if (tabset.sharing?.sharedId && tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK && !this.activeFolder) {
        tabset.sharing.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
        tabset.sharing.sharedAt = new Date().getTime()
      }

      // Placeholder Defaults Application
      this.tab = PlaceholderUtils.applyForDefaultDomains(this.tab)

      // the tab has been added to the tabset, but not saved yet
      let res: any = null
      let content: any = undefined
      if (this.tab.chromeTabId) {
        // saving content excerpt and meta data
        // try {
        //   const contentResult = await chrome.tabs.sendMessage(this.tab.chromeTabId, 'getExcerpt')
        //   const tokens = ContentUtils.html2tokens(contentResult.html)
        //   content = [...tokens].join(" ")
        //   await useTabsetService().saveText(this.tab, content, contentResult.metas)
        // } catch (err) {
        //   console.warn("got error when saving content and metadata:", err, this.tab?.url)
        // }

        const tabContent = useContentStore().getCurrentTabContent
        const tabMetas = useContentStore().getCurrentTabMetas
        if (tabContent) {
          const tokens = ContentUtils.html2tokens(tabContent)
          content = [...tokens].join(' ')
          await useTabsetService().saveText(this.tab, content, tabMetas)
        }

        //res = new ExecutionResult("result", "Link was added")
        const res2 = await useTabsetService().saveTabset(
          this.tabset!,
          new ChangeInfo('tab', 'added', this.tab.id, this.tabset!.id),
        )
        res = new ExecutionResult(res2, 'Link was added')

        // saving thumbnail
        useThumbnailsService().captureVisibleTab(this.tab.id, this.tabset?.id || 'unknown tabsetid')
      } else {
        const res2 = await useTabsetService().saveTabset(this.tabset!)
        res = new ExecutionResult(res2, 'Link was added')
      }

      // add to search index via App Dispatcher
      AppEventDispatcher.dispatchEvent('add-to-search', {
        name: this.tab.name || '',
        title: this.tab.title || '',
        url: this.tab.url || '',
        description: this.tab.description,
        content: content ? content : '',
        tabsets: [this.tabset!.id],
        favIconUrl: this.tab.favIconUrl || '',
      })
      info('tab created')
      localStorage.setItem('test.tabId', this.tab.id)
      sendMsg('tab-added', { tabsetId: this.tabset!.id })

      const req = useRequestsStore().getCurrentTabRequest
      if (req && req.url === this.tab.url) {
        useRequestsService().logWebRequest(JSON.parse(JSON.stringify(req)))
      }

      return res
    } catch (err: any) {
      console.warn('hier: ', err)
      return Promise.reject('error: ' + err.toString())
    }
  }
}

AddTabToTabsetCommand.prototype.toString = function cmdToString() {
  return `AddTabToTabsetCommand: {tabId=${this.tab.id}}`
}
