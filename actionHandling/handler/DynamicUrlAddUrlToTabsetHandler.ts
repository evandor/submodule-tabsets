import { DialogChainObject, QVueGlobals, uid } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'

export class DynamicUrlAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals | undefined) {}
  // constructor(
  //   private tabset: Tabset,
  //   private folder?: Tabset
  // ) {
  // }
  urlMatcher() {
    return /.*/
  }

  contentMatcher(content: string) {
    return false
  }

  actions(): ActionContext[] {
    // return [new ActionContext("Dynamic Load", ButtonActions.DynamicLoad, this.folder)]
    return [new ActionContext('Dynamic Load', ButtonActions.DynamicLoad, undefined)]
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    return undefined
  }

  clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  ): Promise<ExecutionResult<any>> {
    const newTab: Tab = new Tab(uid(), chromeTab)
    return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive))
  }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  ): Promise<ExecutionResult<any>> {
    throw new Error('not implemented J')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}
}
