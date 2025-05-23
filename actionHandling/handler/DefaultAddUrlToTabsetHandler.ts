import { QVueGlobals } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { AddUrlToTabsetHandler, ComponentWithContext } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { DefaultActions } from 'src/tabsets/actionHandling/handler/DefaultActions'
import AddFolderAction from 'src/tabsets/actions/AddFolderAction.vue'
import AddTabAction from 'src/tabsets/actions/AddTabAction.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class DefaultAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    return true // 'default' matches always
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  actions(currentTabsetId: string | undefined, actionProps: ActionProps): ComponentWithContext[] {
    const currentTabset = useTabsetsStore().getCurrentTabset
    const actions = DefaultActions.getDefaultActions(currentTabset, actionProps)
    if (useFeaturesStore().hasFeature(FeatureIdent.FOLDER)) {
      actions.unshift({ component: AddFolderAction, context: {} })
    }
    actions.unshift({ component: AddTabAction, context: {} }) // first action
    return actions
  }
}
