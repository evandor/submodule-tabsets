import { ButtonActions } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { Tabset } from 'src/tabsets/models/Tabset'

export class ActionContext {
  constructor(
    public label: string,
    public identifier: ButtonActions,
    public folder?: Tabset,
    public additionalData?: object,
  ) {}
}
