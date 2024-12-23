import { DialogChainObject } from 'quasar'
import { Tabset } from 'src/tabsets/models/Tabset'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Tab } from 'src/tabsets/models/Tab'
import {
  AddUrlToTabsetHandler,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'

export class NoopAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  urlMatcher() {
    return /.*/
  }

  contentMatcher(content: string) {
    return true
  }

  actions(): ActionContext[] {
    return []
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    return undefined
  }

  clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: object = {},
  ): Promise<ExecutionResult<any>> {
    return Promise.reject('noop AddurlToTabsetHandler')
  }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData: object = {},
  ): Promise<ExecutionResult<any>> {
    return Promise.reject('noop AddurlToTabsetHandler')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {
    throw new Error('noop AddurlToTabsetHandler')
  }
}
