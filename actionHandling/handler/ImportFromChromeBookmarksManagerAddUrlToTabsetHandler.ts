import { DialogChainObject, QVueGlobals } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { DefaultAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/DefaultAddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { CreateTabsetFromBookmarksRecursive } from 'src/tabsets/commands/CreateTabsetFromBookmarksRecursive'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

function getBmFolderId(chromeTab: chrome.tabs.Tab) {
  return chromeTab.url?.split('?')[1]?.split('=')[1] || undefined
}

export class ImportFromChromeBookmarksManagerAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals | undefined) {}

  urlMatcher(): RegExp {
    return /^chrome:\/\/bookmarks.*$/
  }

  contentMatcher(content: string) {
    return false
  }

  actions(): ActionContext[] {
    return [
      {
        label: 'Import...',
        identifier: ButtonActions.ImportChromeBookmarks,
        active: (t: chrome.tabs.Tab) => {
          const folderId = getBmFolderId(t)
          return !folderId ? false : (useTabsetsStore().getCurrentTabset?.bookmarkId || '') !== folderId
        },
      },
      {
        label: 'Add Tab',
        identifier: ButtonActions.AddTab,
        active: (t: chrome.tabs.Tab) => !useTabsetService().urlExistsInCurrentTabset(t.url),
      },
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
      await new DefaultAddUrlToTabsetHandler().clicked(chromeTab, ts, folder, additionalData)
      return Promise.resolve(new ExecutionResult('', 'done'))
    } else {
      const bmFolderId = getBmFolderId(chromeTab)
      if (!bmFolderId) {
        return Promise.reject('could not parse bookmarks id from URL')
      }
      try {
        const currentTabsetName = useTabsetsStore().getCurrentTabset?.name || 'unknown'
        const res: ExecutionResult<Tabset> = await useCommandExecutor().execute(
          new CreateTabsetFromBookmarksRecursive(currentTabsetName, bmFolderId, true),
        )
        const tabset = res.result
        await useTabsetService().saveTabset(tabset)
        console.log('imported to tabset', tabset.id)
        await useTabsetsStore().reloadTabset(tabset.id)
        return Promise.resolve(new ExecutionResult('', ''))
        //  })
      } catch (e: any) {
        console.log('got error', e)
        return Promise.reject('error importing bookmarks')
      }
    }
  }

  updateInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
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
