import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import TabsetService from "src/tabsets/services/TabsetService";
import {MarkTabsetAsDefaultCommand} from "src/tabsets/commands/MarkTabsetAsDefault";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useUtils} from "src/core/services/Utils";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";

const {sendMsg} = useUtils()

class UndoCommand implements Command<any> {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.log("execution undo command", this.tabsetId)
    return new MarkTabsetAsDefaultCommand(this.tabsetId).execute()
      .then(res => new ExecutionResult(res, "Tabset was restored again"))
  }

}

export class MarkTabsetDeletedCommand implements Command<Tabset> {

  constructor(
    public tabsetId: string) {
  }

  async execute(): Promise<ExecutionResult<Tabset>> {
    return TabsetService.markAsDeleted(this.tabsetId)
      .then((tabset) => {
        console.log("deleting", tabset.type, tabset.status, tabset.id, useTabsetsStore().currentTabsetId)
        if (tabset.type === TabsetType.SPECIAL && tabset.id === "BACKUP") {
          //console.log("deactivating")
          useFeaturesStore().deactivateFeature(FeatureIdent.BACKUP.toLowerCase())
        } else if (tabset.type === TabsetType.SPECIAL && tabset.id === "IGNORE") {
          //useFeaturesStore().deactivateFeature(FeatureIdent.IGNORE.toLowerCase())
        }
        if (this.tabsetId === useTabsetsStore().currentTabsetId || useTabsetsStore().currentTabsetId === null) {
          useTabsetService().selectTabset(undefined)
        }
        return tabset
      })
      .then(res => {
        sendMsg('mark-tabset-deleted', {tabsetId: this.tabsetId})
        return res
      })
      .then(res => Promise.resolve(
        new ExecutionResult(
          res,
          "Tabset deleted",
          new Map([["Undo", new UndoCommand(this.tabsetId)]])))
      )
      .catch(err => Promise.reject(err))
  }


}

MarkTabsetDeletedCommand.prototype.toString = function cmdToString() {
  return `MarkTabsetDeletedCommand: {tabsetId=${this.tabsetId}}`;
};
