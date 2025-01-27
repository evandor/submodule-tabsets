import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useLogger } from 'src/services/Logger'
import { StaticSuggestionIdent, Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { SaveOrReplaceResult } from 'src/tabsets/models/SaveOrReplaceResult'
import { TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

const { sendMsg } = useUtils()
const { info } = useLogger()

export class CreateTabsetCommand implements Command<SaveOrReplaceResult> {
  public merge: boolean = true

  constructor(
    public tabsetName: string,
    public tabsToUse: chrome.tabs.Tab[] = [],
    public spaceId: string | undefined = undefined,
    public windowToOpen: string = 'current',
    public color: string | undefined = undefined,
    public dynamicSource: string | undefined = undefined,
  ) {}

  async execute(): Promise<ExecutionResult<SaveOrReplaceResult>> {
    try {
      //const trustedWindowName = this.windowToOpen.replace(STRIP_CHARS_IN_USER_INPUT, '')
      const windowId = this.windowToOpen ? this.windowToOpen.replace(STRIP_CHARS_IN_USER_INPUT, '') : 'current'
      useWindowsStore().addToWindowSet(windowId)
      const result: SaveOrReplaceResult = await useTabsetService()
        .saveOrReplaceFromChromeTabs(
          this.tabsetName,
          this.tabsToUse,
          this.merge,
          windowId,
          TabsetType.DEFAULT,
          this.color,
          this.dynamicSource,
          this.spaceId,
        )
        .then((res) => {
          //JsUtils.gaEvent('tabset-created', {"tabsCount": this.tabsToUse.length})
          Analytics.fireEvent('tabset-created', { tabsCount: this.tabsToUse.length })
          return res
        })
        .then((res) => {
          if (
            useTabsetsStore().tabsets.size > 1 &&
            !useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) &&
            process.env.MODE === 'bex'
          ) {
            useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion('TRY_BOOKMARKS_FEATURE'))
          }
          if (
            useTabsetsStore().tabsets.size >= 15 &&
            !useFeaturesStore().hasFeature(FeatureIdent.SPACES) &&
            process.env.MODE === 'bex'
          ) {
            useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion('TRY_SPACES_FEATURE'))
            // } else if (useTabsetsStore().tabsets.size >= 3 &&
            //     useTabsetsStore().allTabsCount > 10 &&
            //     !useFeaturesStore().hasFeature(FeatureIdent.NEWEST_TABS) &&
            //     process.env.MODE === 'bex') {
            //     useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_NEWEST_TABS_FEATURE))
          }
          info('tabset created')
          sendMsg('tabset-added', { tabsetId: res.tabset.id })
          localStorage.setItem('test.tabsetId', res.tabset.id)
          return res
        })
      let doneMsg = 'Tabset created'
      return Promise.resolve(new ExecutionResult<SaveOrReplaceResult>(result, doneMsg))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateTabsetCommand.prototype.toString = function cmdToString() {
  return `CreateTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}, tabs#=${this.tabsToUse.length}, windowToOpen#=${this.windowToOpen}}`
}
