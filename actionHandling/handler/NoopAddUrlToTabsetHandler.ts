import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'

export class NoopAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  urlMatcher() {
    return /.*/
  }

  contentMatcher(content: string) {
    return true
  }

  defaultAction(): ActionContext {
    return null as unknown as ActionContext
  }

  actions(): ActionContext[] {
    return []
  }

  clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  ): Promise<ExecutionResult<any>> {
    return Promise.reject('noop AddurlToTabsetHandler')
  }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    return Promise.reject('noop AddurlToTabsetHandler')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {
    throw new Error('noop AddurlToTabsetHandler')
  }
}
