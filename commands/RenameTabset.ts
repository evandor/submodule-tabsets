import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import TabsetService from "src/tabsets/services/TabsetService";
import {useUtils} from "src/core/services/Utils";
import {ListDetailLevel} from "src/ui/stores/uiStore";
import {useLogger} from "src/services/Logger";

const {sendMsg} = useUtils()
const {info} = useLogger()

class UndoRenameTabsetCommand implements Command<any> {

  constructor(public tabsetId: string, public oldName: string, public oldColor: string | undefined) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.log("execution undo command", this.tabsetId, this.oldName)
    return new RenameTabsetCommand(this.tabsetId, this.oldName, this.oldColor).execute()
      .then(res => new ExecutionResult(res, "Tabset was renamed back again"))
  }

}

export class RenameTabsetCommand implements Command<any> {

  constructor(
    public tabsetId: string,
    public newName: string,
    public newColor: string | undefined = undefined,
    public window: string = 'current',
    public details: ListDetailLevel = ListDetailLevel.MAXIMAL
  ) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    return TabsetService.rename(this.tabsetId, this.newName, this.newColor, this.window, this.details)
      .then(res => {
        info("renamed tabset")
        sendMsg('tabset-renamed', {tabsetId: this.tabsetId, newName: this.newName, newColor: this.newColor})
        return res
      })
      .then((oldValues: any) => Promise.resolve(
        new ExecutionResult(
          oldValues.oldName,
          "Tabset was updated",
          new Map([["Undo", new UndoRenameTabsetCommand(this.tabsetId, oldValues.oldName, oldValues.oldColor)]])))
      )
      .catch(err => Promise.reject(err))
  }


}
