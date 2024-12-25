import { DialogChainObject, QVueGlobals, uid } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import {
  AddUrlToTabsetHandler,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { ExcalidrawStorage } from 'src/tabsets/actionHandling/model/ExcalidrawStorage'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

/**
 * does not work as intended; cannot overwrite local storage of excalidraw.com
 */
export class ExcalidrawAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals | undefined) {}

  urlMatcher(): RegExp {
    return /^https:\/\/excalidraw\.com\/$/
  }

  contentMatcher(content: string) {
    return false
  }

  actions(): ActionContext[] {
    const tabset: Tabset | undefined = useTabsetsStore().getCurrentTabset
    if (tabset) {
      var actions = (tabset.tabs as Tab[])
        .filter((t: Tab) => t.url !== undefined)
        .filter((t: Tab) => t.url!.match(this.urlMatcher()))
        .map((t: Tab) => {
          return new ActionContext(t.title || 'undefined', ButtonActions.Save)
        })
      return actions.length > 0
        ? actions
            .concat([new ActionContext('Save as new file', ButtonActions.SaveAs)])
            .concat([new ActionContext('Clear canvas', ButtonActions.ClearCanvas)])
        : actions.concat([new ActionContext('Add Excalidraw', ButtonActions.SaveAs)])
    }
    return []
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    switch (action) {
      case ButtonActions.NewFile:
        return this.newFileDialog()
      case ButtonActions.SaveAs:
        return this.newFileDialog()
      default:
        console.log('no dialog for action', action)
    }
  }

  async clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: object,
  ): Promise<ExecutionResult<any>> {
    console.log('saving...', chromeTab.id, additionalData)
    try {
      const filename = additionalData ? additionalData['filename' as keyof object] : undefined
      if (!filename) {
        throw new Error('filename is missing')
      }

      const newTab = new Tab(uid(), chromeTab)

      const returned = await this.queryBrowserTab(chromeTab, newTab.id, filename!)
      if (returned.length > 0) {
        newTab.title = filename

        const firstFrameReturned = returned.at(0)
        console.log('hier', firstFrameReturned)
        if (firstFrameReturned && firstFrameReturned.result) {
          newTab.storage = new ExcalidrawStorage(
            JSON.stringify(JSON.parse(firstFrameReturned.result['excalidraw' as keyof object])),
            firstFrameReturned.result['excalidrawState' as keyof object],
            firstFrameReturned.result['versionFiles' as keyof object],
            firstFrameReturned.result['versionDataState' as keyof object],
          )
        }
        return useCommandExecutor().execute(
          new AddTabToTabsetCommand(newTab, ts, ts.folderActive, true),
        )
      }
    } catch (error: any) {
      console.warn('error', error)
    }

    return Promise.reject('error updating excalidraw')
  }

  async updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData: object = {},
  ): Promise<ExecutionResult<any>> {
    console.log('updating...', chromeTab.id, additionalData)
    try {
      const filename = additionalData['filename' as keyof object]
      if (!filename) {
        throw new Error('filename is missing')
      }
      const returned = await this.queryBrowserTab(chromeTab, '', filename)
      if (returned.length > 0) {
        const tabCandidates = ts.tabs.filter(
          (t: Tab) => t.url!.match(this.urlMatcher()) && t.title === filename,
        )
        const firstFrameReturned = returned.at(0)
        if (firstFrameReturned && firstFrameReturned.result && tabCandidates.length > 0) {
          tabCandidates[0]!.storage = new ExcalidrawStorage(
            JSON.stringify(JSON.parse(firstFrameReturned.result['excalidraw' as keyof object])),
            firstFrameReturned.result['excalidrawState' as keyof object],
            firstFrameReturned.result['versionFiles' as keyof object],
            firstFrameReturned.result['versionDataState' as keyof object],
          )
          await useTabsetsStore().saveTabset(ts)
          return Promise.resolve(new ExecutionResult('', 'done'))
        }
      }
    } catch (error: any) {
      console.warn('error', error)
    }

    return Promise.reject('error updating excalidraw')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {
    console.log('handling opened tab', browserTab.id, tab.id)
    const excalidraw =
      tab.storage || new ExcalidrawStorage([], {}, new Date().getTime(), new Date().getTime())
    console.log('setting to storage', excalidraw)

    chrome.scripting
      .executeScript({
        target: { tabId: browserTab.id || 0 },
        func: (excalidraw: ExcalidrawStorage, tabId: string) => {
          window.addEventListener('beforeunload', () => {
            console.log('beforeunload')
            localStorage.setItem('excalidraw', excalidraw.excalidraw)
            localStorage.setItem('excalidraw-state', JSON.stringify(excalidraw.excalidrawState))
            localStorage.setItem('version-files', '' + excalidraw.versionFiles)
            localStorage.setItem('version-dataState', '' + excalidraw.versionDataState)
            localStorage.setItem('tabsets_tabId', tabId)
          })

          // important: reload!
          location.assign('https://excalidraw.com')
        },
        args: [excalidraw, tab.id],
      })
      .catch((err) => {
        console.warn('error', err)
      })
  }

  private async queryBrowserTab(chromeTab: chrome.tabs.Tab, tabId: string, filename: string) {
    console.log(`queryBrowserTab: tabId=${tabId}, filename=${filename}`)
    return await chrome.scripting.executeScript({
      target: { tabId: chromeTab.id || 0 },
      func: (val: string, tabId: string) => {
        console.log('setting item tabsets_xxx', val, tabId)
        //localStorage.setItem("tabsets_name", val)
        if (tabId.trim() !== '') {
          localStorage.setItem('tabsets_tabId', tabId)
        }
        localStorage.setItem('tabsets_ts', '' + new Date().getTime())
        return {
          excalidraw: localStorage.getItem('excalidraw'),
          excalidrawState: localStorage.getItem('excalidraw-state'),
          versionFiles: localStorage.getItem('version-files'),
          versionDataState: localStorage.getItem('version-dataState'),
        }
      },
      args: [filename, tabId || ''],
    })
  }

  newFileDialog(filename: string = '') {
    if (this.$q) {
      return this.$q!.dialog({
        title: 'Save as Excalidraw File',
        message: 'Please Provide a name (min 3 characters)',
        prompt: { model: filename, isValid: (val: string) => val.length > 2, type: 'text' },
        cancel: true,
        persistent: true,
      })
    } else {
      console.warn('could not display newFileDialog, quasar not set')
    }
  }
}
