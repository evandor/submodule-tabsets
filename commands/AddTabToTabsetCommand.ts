import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {Tabset} from "src/tabsets/models/Tabset";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";


// No undo command, tab can be deleted manually easily

/**
 * Add provided Tab to provided Tabset.
 */
export class AddTabToTabsetCommand implements Command<any> {

  constructor(
    public tab: Tab,
    public tabset: Tabset | undefined = undefined,
    public activeFolder: string | undefined = undefined) {

    if (!tabset) {
      this.tabset = useTabsetsStore().getCurrentTabset
    }
    if (!this.tabset) {
      throw new Error("could not set current tabset")
    }
  }

  async execute(): Promise<ExecutionResult<any>> {
    console.info(`adding tab '${this.tab.id}' to tabset '${this.tabset!.id}', active folder: ${this.activeFolder}`)
    throw new Error("hier")

  }


}

AddTabToTabsetCommand.prototype.toString = function cmdToString() {
  return `AddTabToTabsetCommand: {tab=${this.tab.toString()}}`;
};
