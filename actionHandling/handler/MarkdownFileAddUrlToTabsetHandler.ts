import { DialogChainObject, QVueGlobals, uid } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
  ClickedHandler,
  ComponentWithContext,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import CreateSubfolderAction from 'src/tabsets/actions/CreateSubfolderAction.vue'
import DeleteTabsetAction from 'src/tabsets/actions/DeleteTabsetAction.vue'
import EditTabsetAction from 'src/tabsets/actions/EditTabsetAction.vue'
import OpenAllInMenuAction from 'src/tabsets/actions/OpenAllInMenuAction.vue'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { LoadDynamicTabsCommand } from 'src/tabsets/commands/LoadDynamicTabsCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'

export class MarkdownFileAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    return url.match(/.*\.md$/) !== null
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  defaultAction(): ActionContext {
    return new ActionContext('Add Markdown').withDialog(this.analyseMarkdownDialog, this.$q).onOk(this.onOk)
  }

  actions(): ComponentWithContext[] {
    // return [new ActionContext('Add Markdown Page').withDialog(this.analyseMarkdownDialog, this.$q).onOk(this.onOk)]
    return [
      { component: EditTabsetAction, context: {} },
      { component: CreateSubfolderAction, context: {} },
      { component: OpenAllInMenuAction, context: {} },
      { component: DeleteTabsetAction, context: {} },
    ]
  }

  withDialog(): DialogChainObject | undefined {
    return undefined
  }

  async clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  ): Promise<ExecutionResult<any>> {
    console.log('saving...', chromeTab.id, additionalData)
    try {
      const useForLinks = additionalData.dialog!['useForLinks' as keyof object] as boolean
      const newTab = new Tab(uid(), chromeTab)
      await useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive))
      if (useForLinks) {
        await useCommandExecutor().execute(new LoadDynamicTabsCommand(ts, newTab.url!))
      }
      return Promise.resolve(new ExecutionResult('', 'done'))
    } catch (error: any) {
      console.warn('error', error)
      return Promise.reject('error creating markdown tab')
    }
  }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    throw new Error('not implemented K')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}

  async analyseMarkdownDialog($q: QVueGlobals, filename: string = '') {
    return Promise.resolve(
      $q.dialog({
        title: 'Save Markdown File',
        message: "The file's content can be analysed and dynamically extracted.",
        options: {
          type: 'checkbox',
          model: [],
          items: [{ label: 'Use for links', value: 'useForLinks', color: 'secondary' }],
        },
        cancel: true,
        persistent: true,
      }),
    )
  }

  onOk = (data: string[]): ClickedHandler => {
    console.log('data!', data)
    return this.clicked
  }
}
