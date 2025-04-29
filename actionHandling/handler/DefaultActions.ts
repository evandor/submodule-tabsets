import { LocalStorage } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useContentStore } from 'src/content/stores/contentStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { ComponentWithContext } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import ArchiveTabsetAction from 'src/tabsets/actions/ArchiveTabsetAction.vue'
import ConvertToCollectionAction from 'src/tabsets/actions/ConvertToCollectionAction.vue'
import CreateNoteAction from 'src/tabsets/actions/CreateNoteAction.vue'
import DeleteFolderAction from 'src/tabsets/actions/DeleteFolderAction.vue'
import EditFolderAction from 'src/tabsets/actions/EditFolderAction.vue'
import ExportTabsetAction from 'src/tabsets/actions/ExportTabsetAction.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import NewTabAction from 'src/tabsets/actions/NewTabAction.vue'
import OpenTabsetAction from 'src/tabsets/actions/OpenTabsetAction.vue'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { Component } from 'vue'

export class DefaultActions {
  static getDefaultActions(
    currentTabset: Tabset | undefined,
    actionProps: ActionProps,
  ): (ComponentWithContext | Component)[] {
    const actions: (ComponentWithContext | Component)[] = []
    if (actionProps.level === 'folder') {
      actions.push(EditFolderAction)
    }

    if (useFeaturesStore().hasFeature(FeatureIdent.NOTES)) {
      actions.push(CreateNoteAction)
    }

    if (
      currentTabset &&
      useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET) &&
      currentTabset.status === TabsetStatus.DEFAULT
    ) {
      actions.push(ArchiveTabsetAction)
    }
    if (currentTabset && currentTabset.type === TabsetType.SESSION) {
      actions.push(ConvertToCollectionAction)
    }

    //    actions.push(OpenAllInMenuAction)

    if (useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)) {
      actions.push(ExportTabsetAction)
    }

    if (LocalStorage.getItem('ui.newtab.installed') && actionProps.level === 'root') {
      actions.push(NewTabAction)
    }

    // open existing tabset for url
    if (!DefaultActions.alreadyInTabset() && DefaultActions.tabsetsForUrl().length > 0) {
      actions.push(OpenTabsetAction)
    }

    // actions.push(DeleteTabsetAction)
    if (actionProps.level === 'folder') {
      actions.push(DeleteFolderAction)
    }
    // console.log('action', actions)
    return actions
  }

  static alreadyInTabset = () => {
    return useTabsetService().urlExistsInCurrentTabset(useContentStore().getCurrentTabUrl)
  }

  static tabsetsForUrl = () => {
    const url = useContentStore().getCurrentTabUrl
    if (url) {
      return useTabsetService()
        .tabsetsFor(url)
        .map((tsId: string) => {
          return {
            label: '', //useTabsetService().nameForTabsetId(tsId),
            tabsetId: tsId,
          }
        })
    }
    return []
  }
}
