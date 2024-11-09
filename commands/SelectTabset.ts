import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useUtils} from "src/core/services/Utils";
import {Tabset} from "src/tabsets/models/Tabset";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const {inBexMode, sendMsg} = useUtils()

export class SelectTabsetCommand implements Command<Tabset | undefined> {

  public merge: boolean = true

  constructor(public tabsetId: string,
    public folderId?: string
  ) {
  }

  // TODO this returns the old currentTabset - why? needed?
  async execute(): Promise<ExecutionResult<Tabset | undefined>> {
    console.debug(this.toString())

    const currentTabset = useTabsetsStore().getCurrentTabset

    useTabsetService().selectTabset(this.tabsetId)
    const tabset = useTabsetsStore().getCurrentTabset
    if (tabset && this.folderId) {
      tabset.folderActive = this.folderId
      await useTabsetsStore().saveTabset(tabset)
    }

    if (inBexMode()) {
      const data = {
        ignore: true, // doing this to keep the logic, might be needed again
        data: {tabsetId: this.tabsetId}
      }
      sendMsg('current-tabset-id-change', data);
    }

    const executionResult = new ExecutionResult(currentTabset, "done")
    return Promise.resolve(executionResult)
  }
}

SelectTabsetCommand.prototype.toString = function cmdToString() {
  return `SelectTabsetCommand: {tabsetId=${this.tabsetId}}`;
};
