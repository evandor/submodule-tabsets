import {DialogChainObject, uid} from "quasar";
import {Tabset} from "src/tabsets/models/Tabset";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";

export class DynamicUrlAddUrlToTabsetHandler implements AddUrlToTabsetHandler {

  constructor(
    private tabset: Tabset,
    private folder?: Tabset
  ) {
  }
  urlMatcher() {
    return /.*/;
  }

  contentMatcher(content: string) {
    return false
  }

  actions():{ label: string, identifier: ButtonActions, folder?: Tabset }[] {
    return [{label: "Dynamic Load", identifier: ButtonActions.DynamicLoad, folder: this.folder}]
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    return undefined
  }

  clicked(chromeTab: chrome.tabs.Tab, ts: Tabset, folder?: Tabset,  additionalData: object = {}): Promise<ExecutionResult<any>> {
    const newTab: Tab = new Tab(uid(), chromeTab)
    return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive))
  }

  updateInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    throw new Error("not implemented")
  }

  handleOpenedTab (browserTab: chrome.tabs.Tab, tab: Tab) {

  }
}
