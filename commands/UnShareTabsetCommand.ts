import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import TabsetService from "src/tabsets/services/TabsetService";
import {TabsetSharing} from "src/tabsets/models/Tabset";

export class UnShareTabsetCommand implements Command<any> {

  constructor(
    public tabsetId: string,
    public sharedId: string
  ) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    return TabsetService.share(this.tabsetId, TabsetSharing.UNSHARED, this.sharedId, undefined)
      .then(oldSharing => Promise.resolve(
        new ExecutionResult(
          oldSharing,
          "The tabset not shared anymore"))
      )
      .catch(err => Promise.reject(err))
  }

}

UnShareTabsetCommand.prototype.toString = function cmdToString() {
  return `UnShareTabsetCommand: {tabsetId=${this.tabsetId}}`;
};
