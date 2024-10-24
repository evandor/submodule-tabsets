import {Tabset} from "src/tabsets/models/Tabset";
import {Tab} from "src/tabsets/models/Tab";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {DialogChainObject, QVueGlobals, uid} from "quasar";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

/**
 * does not work as intended; cannot overwrite local storage of excalidraw.com
 */
export class ExcalidrawAddUrlToTabsetHandler implements AddUrlToTabsetHandler {

  constructor(public $q: QVueGlobals | undefined) {
  }

  // Disabled
  urlMatcher(): RegExp {
    return /^https:\/\/excalidraw\.comXXX\/$/;
  }

  contentMatcher(content: string) {
    return false
  }


  actions(): { label: string, identifier: ButtonActions }[] {
    const tabset: Tabset | undefined = useTabsetsStore().getCurrentTabset
    if (tabset) {
      return (tabset.tabs as Tab[])
        .filter((t: Tab) => t.url !== undefined)
        .filter((t: Tab) => t.url!.match(this.urlMatcher()))
        .map((t: Tab) => {
          return {label: t.title || 'undefined', identifier: ButtonActions.Save}
        })
        .concat([{label: 'as new file', identifier: ButtonActions.SaveAs}])
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
        console.log("no dialog for action", action)
    }
  }

  async clicked(chromeTab: chrome.tabs.Tab, ts: Tabset, folder?: Tabset, additionalData?: object): Promise<ExecutionResult<any>> {

    console.log("saving...", chromeTab.id, additionalData)
    try {
      const filename = additionalData ? additionalData['filename' as keyof object] : undefined
      if (!filename) {
        throw new Error("filename is missing")
      }
      const returned = await this.queryBrowserTab(chromeTab, filename!)
      if (returned.length > 0) {
        const newTab = new Tab(uid(), chromeTab)
        newTab.title = filename

        const firstFrameReturned = returned.at(0)
        console.log("hier", firstFrameReturned)
        if (firstFrameReturned && firstFrameReturned.result) {
          newTab.storage = {
            'excalidraw': JSON.parse(firstFrameReturned.result)
          }
        }
        return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive, true))
      }
    } catch (error: any) {
      console.warn("error", error)
    }

    return Promise.reject("error updating excalidraw")


  }

  async updateInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    console.log("updating...", chromeTab.id, additionalData)
    try {
      const filename = additionalData['filename' as keyof object]
      if (!filename) {
        throw new Error("filename is missing")
      }
      const returned = await this.queryBrowserTab(chromeTab, filename)
      if (returned.length > 0) {
        const tabCandidates = ts.tabs.filter((t: Tab) => t.url!.match(this.urlMatcher()) && t.title === filename)
        const firstFrameReturned = returned.at(0)
        if (firstFrameReturned && firstFrameReturned.result && tabCandidates.length > 0) {
          tabCandidates[0].storage = {'excalidraw': JSON.parse(firstFrameReturned.result)}
          await useTabsetsStore().saveTabset(ts)
        }
      }
    } catch (error: any) {
      console.warn("error", error)
    }

    return Promise.reject("error updating excalidraw")
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {
    console.log("handling opened tab", browserTab.id, tab.id)
    const excalidraw = JSON.stringify(tab.storage['excalidraw' as keyof object])
    console.log("setting to storage", excalidraw)
    chrome.scripting.executeScript({
      target: {tabId: browserTab.id || 0},
      func: (val: string) => {
        console.log("setting storage 'excalidraw'", val)
        localStorage.setItem("hi", val)
        localStorage.removeItem("excalidraw")
        //localStorage.setItem("excalidraw", val)
      },
      args: [excalidraw]
    }).catch((err) => {
      console.warn("error", err)
    })
  }

  private async queryBrowserTab(chromeTab: chrome.tabs.Tab, filename: never) {
    return await chrome.scripting.executeScript({
      target: {tabId: chromeTab.id || 0},
      func: (val: string) => {
        console.log("setting item tabsets_name", val)
        localStorage.setItem("tabsets_name", val)
        return localStorage.getItem("excalidraw")
      },
      args: [filename]
    });
  }

  newFileDialog(filename: string = '') {
    if (this.$q) {
      return this.$q!.dialog({
        title: 'Save as Excalidraw File',
        message: 'Please Provide a name (min 3 characters)',
        prompt: {model: filename, isValid: (val: string) => val.length > 2, type: 'text'},
        cancel: true,
        persistent: true
      })
    } else {
      console.warn("could not display newFileDialog, quasar not set")
    }
  }

}
