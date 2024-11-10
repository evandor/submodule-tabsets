import {DialogChainObject, uid} from "quasar";
import {Tabset} from "src/tabsets/models/Tabset";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {ActionContext} from "src/tabsets/actionHandling/model/ActionContext";

export class DefaultAddUrlToTabsetHandler implements AddUrlToTabsetHandler {

  urlMatcher() {
    return /.*/;
  }

  contentMatcher(content: string) {
    return true
  }


  actions():ActionContext[] {
    // const article = useContentStore().currentTabArticle
    // console.log("aritcle2:", article)
    // if (article && article['title' as keyof object]) {
    //   return [new ActionContext("Add Tab", ButtonActions.AddTab),new ActionContext("Reading Mode", ButtonActions.AddReadingModeTab)]
    // }
    return [new ActionContext("Add Tab", ButtonActions.AddTab)]
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
