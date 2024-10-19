import {Tabset} from "src/tabsets/models/Tabset";
import {DialogChainObject, uid} from "quasar";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";

export enum ButtonActions {
  AddTab = "AddTab",
  NewFile = "NewFile",
  SaveAs = "SaveAs",
  Save = "Save"
}

export interface AddUrlToTabsetHandler {

  matches: () => string

  actions: () => { label: string, identifier: ButtonActions }[]

  withDialog: (action: ButtonActions) => DialogChainObject | undefined

  saveInTabset: (chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object) => Promise<ExecutionResult<any>>

  updateInTabset: (chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object) => Promise<ExecutionResult<any>>

  handleOpenedTab: (browserTab: chrome.tabs.Tab, tab: Tab) => void
}



