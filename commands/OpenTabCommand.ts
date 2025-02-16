import { openURL } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { AddUrlToTabsetHandler } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
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

      // special handling
      const protocol = this.tab.url?.split('://')[0]
      switch (protocol) {
        case 'ts-obsidian':
          console.log('protocol', protocol)
          ///www/index.html#/mainpanel/settings
          this.tab.url = chrome.runtime.getURL(
            'www/index.html/#/mainpanel/obsidian/files/' + this.tab.url?.split('://')[1],
          )
          break
        default:
          break
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
      if (useTabsStore2().browserTabs.length > 7 && !useFeaturesStore().hasFeature(FeatureIdent.OPEN_TABS)) {
        useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion('TRY_OPENTABS_FEATURE'))
      }
      Analytics.fireEvent('tabset_tab_opened', {})
      return Promise.resolve(new ExecutionResult('', 'opened'))
    } catch (err: any) {
      return Promise.reject(err)
    }
  }
}

OpenTabCommand.prototype.toString = function cmdToString() {
  return `OpenTabCommand: {tab=${this.tab.id}}`
}
