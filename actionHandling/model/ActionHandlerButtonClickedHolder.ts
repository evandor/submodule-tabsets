import {AddUrlToTabsetHandler} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {ActionContext} from "src/tabsets/actionHandling/model/ActionContext";

export class ActionHandlerButtonClickedHolder {
  constructor(
    public actionHandler: AddUrlToTabsetHandler,
    public identifier: string,
    public actionContext?: ActionContext,
    public additionalData: object = {}
  ) {
  }
}