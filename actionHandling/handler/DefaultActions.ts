import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { ComponentWithContext } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import ArchiveTabsetAction from 'src/tabsets/actions/ArchiveTabsetAction.vue'
import ConvertToCollectionAction from 'src/tabsets/actions/ConvertToCollectionAction.vue'
import CreateCollectionAction from 'src/tabsets/actions/CreateCollectionAction.vue'
import CreateNoteAction from 'src/tabsets/actions/CreateNoteAction.vue'
import CreateSubfolderAction from 'src/tabsets/actions/CreateSubfolderAction.vue'
import DeleteFolderAction from 'src/tabsets/actions/DeleteFolderAction.vue'
import DeleteTabsetAction from 'src/tabsets/actions/DeleteTabsetAction.vue'
import EditFolderAction from 'src/tabsets/actions/EditFolderAction.vue'
import EditTabsetAction from 'src/tabsets/actions/EditTabsetAction.vue'
import OpenAllInMenuAction from 'src/tabsets/actions/OpenAllInMenuAction.vue'
import ShowGalleryAction from 'src/tabsets/actions/ShowGalleryAction.vue'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { Component } from 'vue'

export class DefaultActions {
  static getDefaultActions(currentTabset: Tabset | undefined): (ComponentWithContext | Component)[] {
    const actions: (ComponentWithContext | Component)[] = []
    actions.push(EditTabsetAction)
    actions.push(EditFolderAction)
    actions.push(CreateSubfolderAction)
    actions.push(CreateCollectionAction)

    actions.push(CreateNoteAction)

    if (currentTabset && currentTabset.tabs.length > 0 && useFeaturesStore().hasFeature(FeatureIdent.GALLERY)) {
      actions.push(ShowGalleryAction)
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
    actions.push(OpenAllInMenuAction, DeleteTabsetAction, DeleteFolderAction)
    // console.log('action', actions)
    return actions
  }
}
