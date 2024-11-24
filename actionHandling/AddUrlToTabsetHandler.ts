import {Tabset} from "src/tabsets/models/Tabset";
import {DialogChainObject} from "quasar";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {ActionContext} from "src/tabsets/actionHandling/model/ActionContext";

export enum ButtonActions {
  AddTab = "AddTab",
  OpenTab = "OpenTab",
  AddReadingModeTab = "AddReadingModeTab",
  AddTabWithDynamicFolder = "AddTabWithDynamicFolder",
  NewFile = "NewFile",
  SaveAs = "SaveAs",
  Save = "Save",
  DynamicLoad = "DynamicLoad",
  AddRssFeed = "AddRssFeed",
  LoadRssFeed = "LoadRssFeed",
  ClearCanvas = "ClearCanvas"
}

export interface AddUrlToTabsetHandler {

  urlMatcher: () => RegExp

  contentMatcher: (content: string) => boolean

  actions: () => ActionContext[]

  withDialog: (action: ButtonActions) => DialogChainObject | undefined

  clicked: (browserTab: chrome.tabs.Tab, ts: Tabset, folder?: Tabset, additionalData?: object) => Promise<ExecutionResult<any>>

  updateInTabset: (browserTab: chrome.tabs.Tab, ts: Tabset, additionalData: object) => Promise<ExecutionResult<any>>

  handleOpenedTab: (browserTab: chrome.tabs.Tab, tab: Tab) => void
}



