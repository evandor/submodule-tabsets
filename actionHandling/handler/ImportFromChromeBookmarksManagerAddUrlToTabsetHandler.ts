import { DialogChainObject, QVueGlobals } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { DefaultAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/DefaultAddUrlToTabsetHandler'
import { CreateTabsetFromBookmarksRecursive } from 'src/tabsets/commands/CreateTabsetFromBookmarksRecursive'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

export class ImportFromChromeBookmarksManagerAddUrlToTabsetHandler
  implements AddUrlToTabsetHandler
{
  constructor(public $q: QVueGlobals | undefined) {}

  urlMatcher(): RegExp {
    return /^chrome:\/\/bookmarks.*$/
  }

  contentMatcher(content: string) {
    return false
  }

  actions(): { label: string; identifier: ButtonActions }[] {
    return [
      { label: 'Import Bookmarks', identifier: ButtonActions.ImportChromeBookmarks },
      { label: 'Add Tab', identifier: ButtonActions.AddTab },
    ]
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    switch (action) {
      case ButtonActions.ImportChromeBookmarks:
        return this.importChromeBookmarksDialog()
      default:
        console.log('no dialog for action', action)
    }
  }

  async clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {
      action: { identifier: ButtonActions.AddTab, label: 'default' },
    },
  ): Promise<ExecutionResult<any>> {
    console.log('saving...', chromeTab.id, additionalData)
    if (additionalData.action!.identifier === ButtonActions.AddTab) {
      new DefaultAddUrlToTabsetHandler().clicked(chromeTab, ts, folder, additionalData)
    } else {
      const folderId = chromeTab.url?.split('?')[1]?.split('=')[1] || undefined
      if (!folderId) {
        return Promise.reject('could not parse bookmarks id from URL')
      }
      try {
        useCommandExecutor()
          .execute(new CreateTabsetFromBookmarksRecursive('testimport', folderId))
          .then(async (res: ExecutionResult<Tabset>) => {
            const tabset = res.result
            await useTabsetService().saveTabset(tabset)
            console.log('imported to tabset', tabset.id)
          })
      } catch (e: any) {}
    }
    // try {
    //   const useForLinks = additionalData['useForLinks' as keyof object] as boolean
    //   const newTab = new Tab(uid(), chromeTab)
    //   await useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive))
    //   if (useForLinks) {
    //     // const res = await useCommandExecutor().executeFromUi(new CreateFolderCommand(uid(),"Extracted Links", [],ts.id,undefined, newTab.url!))
    //     // await useTabsetService().saveTabset(ts)
    //     // await useCommandExecutor().execute(new LoadDynamicTabsCommand(ts, res.result as Tabset))
    //     await useCommandExecutor().execute(new LoadDynamicTabsCommand(ts, newTab.url!))
    //   }
    //   return Promise.resolve(new ExecutionResult('', 'done'))
    // } catch (error: any) {
    //   console.warn('error', error)
    //   return Promise.reject('error creating markdown tab')
    // }
    return Promise.reject('error creating markdown tab')
  }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData: object = {},
  ): Promise<ExecutionResult<any>> {
    throw new Error('not implemented K')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}

  importChromeBookmarksDialog() {
    if (this.$q) {
      return this.$q.dialog({
        title: 'Import Bookmarks',
        message: 'Click "OK" to import the  selected bookmarks folder to the current tabset',
        options: {
          type: 'checkbox',
          model: [],
          items: [{ label: 'Recursive', value: 'recursive', color: 'secondary' }],
        },
        cancel: true,
        persistent: true,
      })
    } else {
      console.warn('could not display ImportChromeBookmarkDialog, quasar not set')
    }
  }
}
