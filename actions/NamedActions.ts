import { QVueGlobals } from 'quasar'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { MenuContext } from 'src/tabsets/actionHandling/model/MenuContext'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import NewSubfolderDialog from 'src/tabsets/dialogues/NewSubfolderDialog.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useUiStore } from 'src/ui/stores/uiStore'
import { Component } from 'vue'

export type NamedAction = 'EDIT_TABSET' | 'CREATE_SUBFOLDER' | 'OPEN_ALL_IN'

export class NamedActions {
  private $q: QVueGlobals

  actions: Map<NamedAction, ActionContext | MenuContext> = new Map()

  constructor($q: QVueGlobals, tabset: Tabset) {
    this.$q = $q
    this.actions.set(
      'EDIT_TABSET',
      new ActionContext('Edit Tabset', 'o_note').withDialog(($q: QVueGlobals) => {
        return $q.dialog({
          component: EditTabsetDialog,
          //TODO switch to tabset: tabset?
          componentProps: {
            tabsetId: tabset.id,
            tabsetName: tabset.name,
            tabsetColor: tabset.color,
            window: tabset.window,
            details: tabset.details || useUiStore().listDetailLevel,
            fromPanel: true,
          },
        })
      }, this.$q),
    )
    this.actions.set(
      'CREATE_SUBFOLDER',
      new ActionContext('Create Subfolder', 'o_folder')
        .setColor(() => 'warning')
        .withDialog(($q: QVueGlobals) => {
          return $q.dialog({
            component: NewSubfolderDialog,
            componentProps: {
              tabsetId: tabset.id,
              parentFolder: undefined,
            },
          })
        }, this.$q),
    )
    this.actions.set(
      'OPEN_ALL_IN',
      new ActionContext('Open all in...', 'open_in_new').setColor(() => 'primary'),
    )
  }

  getFor(ident: NamedAction): ActionContext | MenuContext | Component {
    return this.actions.get(ident)!
  }
}
