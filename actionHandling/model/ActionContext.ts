import { DialogChainObject, QVueGlobals } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { AddUrlToTabsetHandlerAdditionalData, ClickedHandler } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { Tabset } from 'src/tabsets/models/Tabset'

export class ActionContext {
  public clicked?: ClickedHandler

  public dialog?: ($q: QVueGlobals) => DialogChainObject | undefined = undefined

  public ok?: (payload: any) => ClickedHandler

  public colorFkt?: () => string

  $q?: QVueGlobals

  constructor(
    public label: string,
    public icon?: string,
    public folder?: Tabset,
    public additionalData?: object,
    public active?: (t: chrome.tabs.Tab) => boolean,
  ) {}

  onClicked(
    clicked: (
      chromeTab: chrome.tabs.Tab,
      ts: Tabset,
      folder?: Tabset,
      additionalData?: AddUrlToTabsetHandlerAdditionalData,
    ) => Promise<ExecutionResult<any>>,
  ) {
    this.clicked = clicked
    return this
  }

  withDialog(withDialog: ($q: QVueGlobals) => DialogChainObject | undefined, $q: QVueGlobals) {
    this.dialog = withDialog
    this.$q = $q
    return this
  }

  onOk(onOkFunction: (data: any) => ClickedHandler) {
    this.ok = onOkFunction
    return this
  }

  setColor(fkt: () => string) {
    this.colorFkt = fkt
    return this
  }
}
