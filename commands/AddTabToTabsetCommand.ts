import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import _ from "lodash";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {Tabset, TabsetSharing} from "src/tabsets/models/Tabset";
import {useUtils} from "src/core/services/Utils";
import {useGroupsStore} from "src/tabsets/stores/groupsStore";
import PlaceholderUtils from "src/tabsets/utils/PlaceholderUtils";
import AppEventDispatcher from "src/app/AppEventDispatcher";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import ContentUtils from "src/core/utils/ContentUtils";
import BrowserApi from "src/app/BrowserApi";
import {useThumbnailsService} from "src/thumbnails/services/ThumbnailsService";
import {useLogger} from "src/services/Logger";
import {useAuthStore} from "stores/authStore.ts";
import {doc, setDoc} from "firebase/firestore";
import FirebaseServices from "src/services/firebase/FirebaseServices.ts";
import {uid} from "quasar";

const {saveTabset} = useTabsetService()
const {sendMsg} = useUtils()
const {info} = useLogger()

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
    public ignoreDuplicates: boolean = false
  ) {

    if (!tabset) {
      this.tabset = useTabsetsStore().getCurrentTabset
    }
    if (!this.tabset) {
      throw new Error("could not set current tabset")
    }
  }

  async execute(): Promise<ExecutionResult<any>> {
    console.info(`adding tab '${this.tab.id}' to tabset '${this.tabset!.id}', active folder: ${this.activeFolder}`)

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
      console.debug("checking 'tab exists' yields", exists)
      if (exists && !this.ignoreDuplicates) {
        return Promise.reject("tab already exists in this tabset")
      } else if (exists) {
        return Promise.resolve("","")
      }
    }

    try {
      // manage (chrome) Group
      console.log("updating tab group for group id", this.tab.groupId)
      const currentGroup = useGroupsStore().currentGroupForId(this.tab.groupId)
      this.tab.groupName = currentGroup?.title || undefined
      if (currentGroup) {
        await useGroupsStore().persistGroup(currentGroup)
      }

      const tabset: Tabset = await useTabsetService().addToTabset(tabsetOrFolder, this.tab, 0, this.allowDuplicates)

      // Analysis
      if (useAuthStore().user.uid && this.tab.url?.startsWith("https://")) {
        const userId = useAuthStore().user.uid
        setDoc(doc(FirebaseServices.getFirestore(), "users", userId, "queue", uid()),{"event": "new-tab", "url": this.tab.url})
      }

      // Sharing
      if (tabset.sharedId && tabset.sharing === TabsetSharing.PUBLIC_LINK && !this.activeFolder) {
        tabset.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
        tabset.sharedAt = new Date().getTime()
      }

      // Placeholder Defaults Application
      this.tab = PlaceholderUtils.applyForDefaultDomains(this.tab)

      // the tab has been added to the tabset, but not saved yet
      let res: any = null
      let content: any = undefined
      if (this.tab.chromeTabId) {
        // saving content excerpt and meta data
        try {
          const contentResult = await chrome.tabs.sendMessage(this.tab.chromeTabId, 'getExcerpt')
          const tokens = ContentUtils.html2tokens(contentResult.html)
          content = [...tokens].join(" ")
          await useTabsetService().saveText(this.tab, content, contentResult.metas)
        } catch (err) {
          console.warn("got error when saving content and metadata:", err, this.tab?.url)
        }
        //res = new ExecutionResult("result", "Link was added")
        const res2 = await saveTabset(this.tabset!)
        res = new ExecutionResult(res2, "Link was added")

        // saving thumbnail
        useThumbnailsService().captureVisibleTab(this.tab.id)

      } else {
        const res2 = await saveTabset(this.tabset!)
        res = new ExecutionResult(res2, "Link was added")

      }

      // add indicator icon
      if (this.tab.chromeTabId && this.tab.url) {
        BrowserApi.addIndicatorIcon(this.tab.chromeTabId, this.tab.url)
      }

      // add to search index via App Dispatcher
      AppEventDispatcher.dispatchEvent('add-to-search', {
        name: this.tab.name || '',
        title: this.tab.title || '',
        url: this.tab.url || '',
        description: this.tab.description,
        content: content ? content : '',
        tabsets: [this.tabset!.id],
        favIconUrl: this.tab.favIconUrl || ''
      })
      info("tab created")
      sendMsg('tab-added', {tabsetId: this.tabset!.id})
      return res
    } catch (err) {
      console.warn("hier: ", err)
      return Promise.reject("error: " + err)
    }
  }


}

AddTabToTabsetCommand.prototype.toString = function cmdToString() {
  return `AddTabToTabsetCommand: {tab=${this.tab.toString()}}`;
};
