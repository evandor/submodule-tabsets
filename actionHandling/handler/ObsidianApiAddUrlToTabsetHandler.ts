import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { RestApiDefinitions } from 'src/rest/RestApiDefinitions'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import CreateSubfolderAction from 'src/tabsets/actions/CreateSubfolderAction.vue'
import DeleteTabsetAction from 'src/tabsets/actions/DeleteTabsetAction.vue'
import EditTabsetAction from 'src/tabsets/actions/EditTabsetAction.vue'
import OpenAllInMenuAction from 'src/tabsets/actions/OpenAllInMenuAction.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { Component } from 'vue'

export class ObsidianApiAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  urlMatcher(): RegExp {
    return /^http:\/\/127.0.0.1:27123\/$/
  }

  contentMatcher(content: string): boolean {
    return false
  }

  defaultAction(): ActionContext {
    return new ActionContext('Add Obsidian vault').onClicked(this.clicked)
  }

  actions(): Component[] {
    return [EditTabsetAction, CreateSubfolderAction, OpenAllInMenuAction, DeleteTabsetAction]
  }

  async clicked(
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    folder: Tabset | undefined,
    additionalData: AddUrlToTabsetHandlerAdditionalData | undefined,
  ): Promise<ExecutionResult<any>> {
    //console.log(`handleOpenedTab ${browserTab}, ${ts as Tabset}, ${additionalData}`)

    const api = RestApiDefinitions.getApi('OBSIDIAN')
    if (api) {
      const tabset = await api.fetchTabset({})
      // tabset.folders.push(...folders)
      console.log('saving', tabset)
      await useTabsetsStore().saveTabset(tabset)
      return new ExecutionResult('done', 'done')
    }
    return Promise.reject('could not find API')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab): void {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.log(`handleOpenedTab ${browserTab}`)
  }

  async updateInTabset(
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    return Promise.reject('not implemented')
  }
}
