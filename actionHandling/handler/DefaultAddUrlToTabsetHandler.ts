import { QVueGlobals, uid } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useContentStore } from 'src/content/stores/contentStore'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import CreateNoteAction from 'src/tabsets/actions/CreateNoteAction.vue'
import CreateSubfolderAction from 'src/tabsets/actions/CreateSubfolderAction.vue'
import DeleteTabsetAction from 'src/tabsets/actions/DeleteTabsetAction.vue'
import EditTabsetAction from 'src/tabsets/actions/EditTabsetAction.vue'
import OpenAllInMenuAction from 'src/tabsets/actions/OpenAllInMenuAction.vue'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
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
    return new ActionContext('Add Tab').onClicked(this.clicked)
  }

  actions(currentTabsetId: string | undefined): Component[] {
    const url = useContentStore().getCurrentTabUrl
    // const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()

    const actions = [EditTabsetAction, CreateSubfolderAction]
    if (useFeaturesStore().hasFeature(FeatureIdent.NOTES)) {
      actions.push(CreateNoteAction)
    }
    actions.push(OpenAllInMenuAction, DeleteTabsetAction)

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
