import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useLogger} from "src/services/Logger";
import {useTabsetsUiStore} from "src/tabsets/stores/tabsetsUiStore";
import {useSpacesStore} from "src/spaces/stores/spacesStore";

const {info} = useLogger()

export class DeleteTabsetCommand implements Command<string> {

  constructor(public tabsetId: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    return useTabsetService().deleteTabset(this.tabsetId)
      .then(res => {
        //sendMsg('tabset-deleted', {tabsetId: this.tabsetId})
        useTabsetsUiStore().clearFromLastUsedTabsets(useSpacesStore().space?.id || undefined, this.tabsetId)
        info("tabset deleted")
        return res
      })
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset deleted")))
      .catch(err => Promise.reject(err))
  }
}

DeleteTabsetCommand.prototype.toString = function cmdToString() {
  return `DeleteTabsetCommand: {tabsetId=${this.tabsetId}}`;
};
