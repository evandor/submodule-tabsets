import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { useLogger } from 'src/services/Logger'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TABSET_NAME_MAX_LENGTH, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const { info } = useLogger()

export class CreateFolderCommand implements Command<Tabset> {
  public merge: boolean = true

  constructor(
    public folderId: string,
    public folderName: string,
    public tabsToUse: Tab[],
    public tabsetId: string,
    public parentFolder?: string,
    public dynamicUrl?: string,
    private type?: TabsetType,
  ) {
    if (folderName.length > TABSET_NAME_MAX_LENGTH) {
      this.folderName = folderName.substring(0, TABSET_NAME_MAX_LENGTH - 3) + '...'
    }
  }

  async execute(): Promise<ExecutionResult<Tabset>> {
    try {
      const tabset = useTabsetsStore().getTabset(this.tabsetId)!
      const oldFolderActive = tabset.folderActive
      if (this.parentFolder) {
        tabset.folderActive = this.parentFolder
      }
      if (!tabset.folderActive || tabset.id === tabset.folderActive) {
        // assuming root
        const tabs = this.tabsToUse //_.map(this.tabsToUse, (t: chrome.tabs.Tab) => new Tab(uid(), t))
        const newFolder = new Tabset(this.folderId, this.folderName, tabs)
        console.log('newFolder', newFolder)
        newFolder.type = this.type || TabsetType.DEFAULT
        newFolder.dynamicUrl = this.dynamicUrl
        newFolder.folderParent = tabset.id
        if (!tabset.folders) {
          tabset.folders = []
        }
        tabset.folders.push(newFolder)
        await useTabsetService().saveTabset(tabset)
        info('folder created')
        Analytics.fireEvent('tabset_folder_created', {})
        return Promise.resolve(new ExecutionResult<Tabset>(newFolder, 'Folder created'))
      }
      const parentFolder = useTabsetsStore().getActiveFolder(tabset)
      if (parentFolder) {
        const newFolder = new Tabset(this.folderId, this.folderName, this.tabsToUse)
        newFolder.type = this.type || TabsetType.DEFAULT
        newFolder.dynamicUrl = this.dynamicUrl
        newFolder.folderParent = parentFolder.id
        if (!tabset.folders) {
          tabset.folders = []
        }
        parentFolder.folders.push(newFolder)
        if (this.parentFolder) {
          tabset.folderActive = oldFolderActive
        }
        await useTabsetService().saveTabset(tabset)
        info('subfolder created')
        Analytics.fireEvent('tabset_subfolder_created', {})
        return Promise.resolve(new ExecutionResult<Tabset>(newFolder, 'Subfolder created'))
      }
      console.log(`missed subfolder for tabset '${tabset.name}', #${tabset.id}`)
      return Promise.reject('could not find subfolder')
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateFolderCommand.prototype.toString = function cmdToString() {
  return `CreateFolderCommand: {tabsetId='${this.tabsetId}', folderId: '${this.folderId}', folderName='${this.folderName}', parentFolder=${this.parentFolder}, dynamicUrl=${this.dynamicUrl}, tabs#=${this.tabsToUse.length}`
}
