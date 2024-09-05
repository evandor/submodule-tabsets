import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {Tabset} from "src/tabsets/models/Tabset";
import {uid} from "quasar";
import _ from "lodash"
import {Tab} from "src/tabsets/models/Tab";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

export class CreateFolderCommand implements Command<string> {

  public merge: boolean = true

  constructor(
    public folderName: string,
    public tabsToUse: chrome.tabs.Tab[],
    public tabsetId: string,
    public parentFolder: string | undefined = undefined) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    try {
      const tabset = useTabsetsStore().getTabset(this.tabsetId)!
      if (!tabset.folderActive) {
        const tabs = _.map(this.tabsToUse, (t: chrome.tabs.Tab) => new Tab(uid(), t))
        const newFolder = new Tabset(uid(), this.folderName, tabs)
        newFolder.folderParent = tabset.id
        if (!tabset.folders) {
          tabset.folders = []
        }
        tabset.folders.push(newFolder)
        await useTabsetService().saveTabset(tabset)
        return Promise.resolve(new ExecutionResult<string>("result", 'Folder created'))
      }
      //const parentFolder = this.getFolder(tabset, tabset.folderActive)
      const parentFolder = useTabsetsStore().getActiveFolder(tabset)

      //TODO use useTabsetService().findFolder(tabset.folders, tabset.folderActive)
      if (parentFolder) {
        const newFolder = new Tabset(uid(), this.folderName, [])
        newFolder.folderParent = parentFolder.id
        if (!tabset.folders) {
          tabset.folders = []
        }
        parentFolder.folders.push(newFolder)
        await useTabsetService().saveTabset(tabset)
        return Promise.resolve(new ExecutionResult<string>("result", 'Subfolder created'))
      }
      return Promise.reject("could not find subfolder")
    } catch (err) {
      return Promise.reject(err)
    }
  }

}

CreateFolderCommand.prototype.toString = function cmdToString() {
  return `CreateFolderCommand: {tabsetId=${this.tabsetId}, folderName=${this.folderName}, parentFolder=${this.parentFolder}}`;
};
