import {Tabset} from "src/tabsets/models/Tabset";
import {ButtonActions} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";

export class ActionContext {
  constructor(
    public label: string,
    public identifier: ButtonActions,
    public folder?: Tabset
  ) {
  }
}
