import { QVueGlobals, uid } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useAuthStore } from 'src/stores/authStore'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { DefaultActions } from 'src/tabsets/actionHandling/handler/DefaultActions'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { Component } from 'vue'

export class DefaultAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    return true
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  defaultAction(): ActionContext {
    const limitReached = useAuthStore().limitExceeded('TABS', useTabsetsStore().allTabsCount + 1).exceeded
    return new ActionContext('Add Tab', 'sym_o_add')
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
      .setStyle((t: chrome.tabs.Tab, folder: Tabset | undefined) => {
        return useTabsetService().urlExistsInCurrentTabset(t.url, folder?.id) ? 'color: #bfbfbf' : ''
      })
      .onClicked(this.clicked)
  }

  actions(currentTabsetId: string | undefined, actionProps: ActionProps): Component[] {
    const url = useContentStore().getCurrentTabUrl
    const currentTabset = useTabsetsStore().getCurrentTabset

    //console.log('actionProps', actionProps)
    const actions = DefaultActions.getDefaultActions(currentTabset, actionProps)

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
