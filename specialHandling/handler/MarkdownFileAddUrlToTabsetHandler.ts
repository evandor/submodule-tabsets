import {DialogChainObject, QVueGlobals, uid} from "quasar";
import {Tabset} from "src/tabsets/models/Tabset";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";
import {CreateFolderCommand} from "src/tabsets/commands/CreateFolderCommand";

/**
 * disabled for now
 */
export class MarkdownFileAddUrlToTabsetHandler implements AddUrlToTabsetHandler {

  constructor(public $q: QVueGlobals | undefined) {
  }

  // Disabled
  urlMatcher(): RegExp {
    return /.*\.mdXXX$/;
  }

  contentMatcher(content: string) {
    return false
  }

  actions(): { label: string, identifier: ButtonActions }[] {
    return [{label: "Add Markdown Page", identifier: ButtonActions.AddTabWithDynamicFolder}]
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    switch (action) {
      case ButtonActions.AddTabWithDynamicFolder:
        return this.analyseMarkdownDialog()
      default:
        console.log("no dialog for action", action)
    }
  }

  async clicked(chromeTab: chrome.tabs.Tab, ts: Tabset,  folder?: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    console.log("saving...", chromeTab.id, additionalData)
    try {
      const useForLinks = additionalData['useForLinks' as keyof object] as boolean
      const newTab = new Tab(uid(), chromeTab)
      await useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive))
      if (useForLinks) {
        await useCommandExecutor().executeFromUi(new CreateFolderCommand(uid(),"Extracted Links", [],ts.id,undefined, newTab.url!))
      }
      return Promise.resolve(new ExecutionResult("","done"))
    } catch (error: any) {
      console.warn("error", error)
      return Promise.reject("error creating markdown tab")
    }

  }

  updateInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    throw new Error("not implemented")
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {

  }

  analyseMarkdownDialog(filename: string = '') {
    if (this.$q) {
      return this.$q!.dialog({
        title: 'Save Markdown File',
        message: 'The file\'s content can be analysed and dynamically extracted.',
        options: {
          type: 'checkbox',
          model: [],
          items: [
            {label: 'Use for links', value: 'useForLinks', color: 'secondary'}
          ]
        },
        cancel: true,
        persistent: true
      })
    } else {
      console.warn("could not display analyseMarkdownDialog, quasar not set")
    }
  }
}
