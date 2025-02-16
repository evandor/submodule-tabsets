import { DialogChainObject } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { RestApiDefinitions } from 'src/rest/RestApiDefinitions'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class RapidApiAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  urlMatcher(): RegExp {
    return /^https:\/\/rapidapi.com\/borjaberastegui\/api\/website-categorization-api-now-with-ai\/playground/
  }

  contentMatcher(content: string): boolean {
    return false
  }

  actions(): ActionContext[] {
    return [new ActionContext('Add Rapid API', ButtonActions.Save)]
  }

  clicked(
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    folder: Tabset | undefined,
    additionalData: AddUrlToTabsetHandlerAdditionalData | undefined,
  ): Promise<ExecutionResult<any>> {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.log(`clicked ${ts}`)
    return Promise.reject('undefined')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab): void {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.log(`handleOpenedTab ${browserTab}`)
  }

  // TODO wrong method !?!
  async updateInTabset(
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.log(`handleOpenedTab ${browserTab}, ${ts as Tabset}, ${additionalData}`)

    const api = RestApiDefinitions.getApi('RAPID_API_WEBSITE_CATEGORIZATION')
    if (api) {
      const tabset = await api.fetchTabset({ browserTab })
      // tabset.folders.push(...folders)
      console.log('saving', tabset)
      await useTabsetsStore().saveTabset(tabset)
      return new ExecutionResult('done', 'done')
    }
    return Promise.reject('could not find API')
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    return undefined
  }
}
