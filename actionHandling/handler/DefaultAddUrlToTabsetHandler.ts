import { DialogChainObject, uid } from 'quasar'
import { Tabset } from 'src/tabsets/models/Tabset'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Tab } from 'src/tabsets/models/Tab'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import {
  AddUrlToTabsetHandler,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { useContentStore } from 'src/content/stores/contentStore'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class DefaultAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  urlMatcher() {
    return /.*/
  }

  contentMatcher(content: string) {
    return true
  }

  actions(): ActionContext[] {
    const url = useContentStore().getCurrentTabUrl
    const currentTabsetId = useTabsetsStore().currentTabsetId
    const actions = [new ActionContext('Add Tab', ButtonActions.AddTab)]
    if (url) {
      // TODO folders?
      const tabsetIds = useTabsetService()
        .tabsetsFor(url)
        .filter((tsId: string) => tsId !== currentTabsetId)

      if (tabsetIds.length > 0) {
        tabsetIds.forEach((tabsetId: string) => {
          actions.push(new ActionContext('Open', ButtonActions.OpenTab, undefined, { tabsetId }))
        })
      }
    }
    return actions
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
    const actionContext: ActionContext | undefined = additionalData['action' as keyof object] as
      | ActionContext
      | undefined
    if (
      actionContext &&
      actionContext.identifier === ButtonActions.OpenTab &&
      actionContext.additionalData
    ) {
      useTabsetsStore().selectCurrentTabset(
        actionContext.additionalData['tabsetId' as keyof object],
      )
      return Promise.resolve(new ExecutionResult('', ''))
    }
    const newTab: Tab = new Tab(uid(), chromeTab)
    return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, folder?.id))
  }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData: object = {},
  ): Promise<ExecutionResult<any>> {
    throw new Error('not implemented I')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}
}
