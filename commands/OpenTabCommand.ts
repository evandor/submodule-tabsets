import { openURL } from 'quasar'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { AddUrlToTabsetHandler } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref } from 'vue'

const { inBexMode } = useUtils()

export class OpenTabCommand implements Command<string> {
  getHandler = useActionHandlers(undefined).getHandler

  constructor(public tab: Tab) {}

  async execute() {
    try {
      if (!inBexMode()) {
        openURL(this.tab.url!)
        return Promise.resolve(new ExecutionResult('', 'opened'))
      }
      const handler = ref<AddUrlToTabsetHandler>(this.getHandler(this.tab.url!))
      const browserTab = await useNavigationService().browserTabFor(this.tab.url!)
      handler.value.handleOpenedTab(browserTab, this.tab)
      //useContentStore().currentTabId = this.tab.id
      await chrome.tabs.highlight({ tabs: browserTab.index })
      if (this.tab.httpInfo && this.tab.httpInfo === 'UPDATED' && this.tab.url) {
        this.tab.httpInfo = ''
        if (useTabsetsStore().getCurrentTabset) {
          await useTabsetsStore().saveTabset(useTabsetsStore().getCurrentTabset!)
        }
      }
      if (this.tab.httpStatus === 0) {
        this.tab.httpStatus = 200 // ok "for now"
      }
      return Promise.resolve(new ExecutionResult('', 'opened'))
    } catch (err: any) {
      return Promise.reject(err)
    }
  }
}

OpenTabCommand.prototype.toString = function cmdToString() {
  return `OpenTabCommand: {tab=${this.tab.id}}`
}
