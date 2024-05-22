import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import TabsetService from "src/tabsets/services/TabsetService";

export class ImportTabsetsCommand implements Command<string> {

  constructor(
    public json: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    TabsetService.importData(this.json)
    return Promise.resolve(
      new ExecutionResult(
        "done",
        "Tabsets were imported"))
  }

}

ImportTabsetsCommand.prototype.toString = function cmdToString() {
  return `ImportTabsetsCommand`;
};
