import { QVueGlobals, uid } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { Component } from 'vue'

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

  defaultAction(): ActionContext {
    return null as unknown as ActionContext
  }

  actions(): Component[] {
    // return [new ActionContext("Dynamic Load", ButtonActions.DynamicLoad, this.folder)]
    // new ActionContext('Dynamic Load', ButtonActions.DynamicLoad, undefined)
    return []
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
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    throw new Error('not implemented J')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}
}
