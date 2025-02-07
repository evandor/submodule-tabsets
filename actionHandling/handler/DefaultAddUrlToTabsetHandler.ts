import { DialogChainObject, uid } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
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
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class DefaultAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  urlMatcher(): RegExp {
    return /.*/
  }

  contentMatcher(content: string) {
    return true
  }

  actions(currentTabsetId: string | undefined): ActionContext[] {
    const url = useContentStore().getCurrentTabUrl
    // const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
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
    additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  ): Promise<ExecutionResult<any>> {
    const actionContext: ActionContext | undefined = additionalData.action
    if (actionContext && actionContext.identifier === ButtonActions.OpenTab && actionContext.additionalData) {
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
