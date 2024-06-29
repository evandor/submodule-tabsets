import Command from "src/core/domain/Command";
import TabsetService from "src/tabsets/services/TabsetService";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import _ from "lodash";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {Tabset} from "src/tabsets/models/Tabset";
import {useUtils} from "src/core/services/Utils";
import {useGroupsStore} from "src/tabsets/stores/groupsStore";
import PlaceholderUtils from "src/tabsets/utils/PlaceholderUtils";
import AppEventDispatcher from "src/services/AppEventDispatcher";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const {saveTabset} = useTabsetService()
const {sendMsg} = useUtils()

// No undo command, tab can be deleted manually easily

/**
 * Add provided Tab to provided Tabset.
 */
export class AddTabToTabsetCommand implements Command<any> {

  constructor(
    public tab: Tab,
    public tabset: Tabset | undefined = undefined,
    public activeFolder: string | undefined = undefined) {

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
      const folder = useTabsetService().findFolder(this.tabset!.folders, this.activeFolder)
      if (folder) {
        tabsetOrFolder = folder
      }
    }

    const exists = _.findIndex(tabsetOrFolder.tabs, (t: any) => t.url === this.tab.url) >= 0
    console.debug("checking 'tab exists' yields", exists)
    if (!exists) {
      try {
        // manage (chrome) Group
        console.log("updating tab group for group id", this.tab.groupId)
        const currentGroup = useGroupsStore().currentGroupForId(this.tab.groupId)
        this.tab.groupName = currentGroup?.title || undefined
        if (currentGroup) {
          await useGroupsStore().persistGroup(currentGroup)
        }

        const tabset: Tabset = await useTabsetService().addToTabset(tabsetOrFolder, this.tab, 0)

        // Analysis
        // if (useAuthStore().isAuthenticated && this.tab.url?.startsWith("https://")) {
        //   const userId = useAuthStore().user.uid
        //   setDoc(doc(FirebaseServices.getFirestore(), "users", userId, "queue", uid()),{"event": "new-tab", "url": this.tab.url})
        // }

        // Sharing
        // if (tabset.sharedId && tabset.sharing === TabsetSharing.PUBLIC_LINK && !this.activeFolder) {
        //   tabset.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
        //   tabset.sharedAt = new Date().getTime()
        // }

        // Placeholder Defaults Application
        this.tab = PlaceholderUtils.applyForDefaultDomains(this.tab)

        // the tab has been added to the tabset, but not saved yet
        const content = await TabsetService.getContentFor(this.tab)
        let res: any = null
        if (content) {
          const res2 = await useTabsetService().saveText(this.tab, content.content, content.metas)
          res = new ExecutionResult("result", "Tab was added",)
        } else {
          const res2 = saveTabset(this.tabset!)
          res = new ExecutionResult(res2, "Tab was added")
        }
        // add to search index via App Dispatcher
        AppEventDispatcher.dispatchEvent('add-to-search', {
          name: this.tab.name || '',
          title: this.tab.title || '',
          url: this.tab.url || '',
          description: this.tab.description,
          content: content ? content['content' as keyof object] : '',
          tabsets: [this.tabset!.id],
          favIconUrl: this.tab.favIconUrl || ''
        })
        sendMsg('tab-added', {tabsetId: this.tabset!.id})
        return res
      } catch (err) {
        console.warn("hier: ", err)
        return Promise.reject("error: " + err)
      }
    } else {
      return Promise.reject("tab already exists in this tabset")
    }


  }


}

AddTabToTabsetCommand.prototype.toString = function cmdToString() {
  return `AddTabToTabsetCommand: {tab=${this.tab.toString()}}`;
};
