import {Tabset} from "src/tabsets/models/Tabset";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import _ from "lodash";
import {Tab} from "src/tabsets/models/Tab";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {uid} from "quasar";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";

export class ExcalidrawAddUrlToTabsetHandler implements AddUrlToTabsetHandler {

  matches() {
    return "https://excalidraw.com/";
  }

  actions(): { label: string, identifier: ButtonActions }[] {
    const tabset: Tabset | undefined = useTabsetsStore().getCurrentTabset
    if (tabset) {
      return _.map(
        _.filter(tabset.tabs as Tab[], (t: Tab) => {
          return t.url === this.matches()
        }),
        (t: Tab) => {
          return {label: t.title || 'undefined', identifier: ButtonActions.AddTab}
        }).concat([{label: 'save as new file', identifier: ButtonActions.NewFile}])
    }
    return []
  }

  // setupNewTab(): (chromeTab: chrome.tabs.Tab) => Tab {
  //   return (chromeTab: chrome.tabs.Tab) => {
  //
  //     useQuasar().dialog({
  //       title: 'Save as Excalidraw File',
  //       message: 'Please Provide a name (min 3 characters)',
  //       prompt: {
  //         model: '',
  //         isValid: (val: string) => val.length > 2,
  //         type: 'text'
  //       },
  //       cancel: true,
  //       persistent: true
  //     }).onOk(async (data: string) => {
  //       //   console.log("updating", currentChromeTab.value!.id, data)
  //       //   try {
  //       //     await chrome.scripting.executeScript({
  //       //       target: {tabId: currentChromeTab.value!.id || 0},
  //       //       func: (val: string) => {
  //       //         console.log("setting item tabsets_name", val)
  //       //         localStorage.setItem("tabsets_name", val)
  //       //       },
  //       //       args: [data]
  //       //     })
  //       //   } catch (error: any) {
  //       //     console.warn("error", error)
  //       //   }
  //       //
  //       //   console.log("hier")
  //       //   const newTab = new Tab(uid(), currentChromeTab.value!)
  //       //   newTab.title = data
  //       //   useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, useTS, activeFolder))
  //       return (chromeTab: chrome.tabs.Tab) => new Tab(uid(), chromeTab)
  //     })
  //
  //     return new Tab(uid(), chromeTab)
  //   }
  // }

  saveInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, activeFolder: string | undefined): Promise<ExecutionResult<any>> {
    const newTab: Tab = new Tab(uid(), chromeTab)
    return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, activeFolder))
  }
}
