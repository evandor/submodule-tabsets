import { QVueGlobals, uid } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { DefaultActions } from 'src/tabsets/actionHandling/handler/DefaultActions'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useAuthStore } from 'stores/authStore'
import { Component } from 'vue'

export class DefaultAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals) {}

  urlMatcher(): RegExp {
    return /.*/
  }

  contentMatcher(content: string) {
    return true
  }

  defaultAction(): ActionContext {
    const limitReached = useAuthStore().limitExceeded('TABS', useTabsetsStore().allTabsCount).exceeded
    return new ActionContext('Add Tab')
      .setColor(() => {
        const tabUrl = useContentStore().getCurrentTabUrl
        if (tabUrl) {
          if (limitReached) {
            return 'negative'
          }
          const tabsetsCount = useTabsetService().tabsetsFor(tabUrl).length
          if (useTabsetService().urlExistsInCurrentTabset(tabUrl)) {
            return 'primary'
          }
          return tabsetsCount > 0 ? 'positive' : ''
        }
        return ''
      })
      .onClicked(this.clicked)
  }

  actions(currentTabsetId: string | undefined): Component[] {
    const url = useContentStore().getCurrentTabUrl
    const currentTabset = useTabsetsStore().getCurrentTabset

    const actions = DefaultActions.getDefaultActions(currentTabset)

    if (url) {
      // TODO folders?
      const tabsetIds = useTabsetService()
        .tabsetsFor(url)
        .filter((tsId: string) => tsId !== currentTabsetId)

      if (tabsetIds.length > 0) {
        tabsetIds.forEach((tabsetId: string) => {
          //actions.push(new ActionContext('Open', undefined, undefined, { tabsetId }).onClicked(this.clicked))
        })
      }
    }
    return actions
  }

  clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  ): Promise<ExecutionResult<any>> {
    const actionContext: ActionContext | undefined = additionalData.action
    if (actionContext && actionContext.additionalData) {
      useTabsetsStore().selectCurrentTabset(actionContext.additionalData['tabsetId' as keyof object])
      return Promise.resolve(new ExecutionResult('', ''))
    }
    const newTab: Tab = new Tab(uid(), chromeTab)
    return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, folder?.id))
  }

  updateInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    throw new Error('not implemented I')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}
}
