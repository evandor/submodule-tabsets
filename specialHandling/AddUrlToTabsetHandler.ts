import {Tabset} from "src/tabsets/models/Tabset";
import {DialogChainObject} from "quasar";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";

export enum ButtonActions {
  AddTab = "AddTab",
  AddTabWithDynamicFolder = "AddTabWithDynamicFolder",
  NewFile = "NewFile",
  SaveAs = "SaveAs",
  Save = "Save",
  DynamicLoad = "DynamicLoad",
  AddRssFeed = "AddRssFeed",
  LoadRssFeed = "LoadRssFeed"
}

export interface AddUrlToTabsetHandler {

  urlMatcher: () => RegExp

  contentMatcher: (content: string) => boolean

  actions: () => { label: string, identifier: ButtonActions, folder?: Tabset }[]

  withDialog: (action: ButtonActions) => DialogChainObject | undefined

  clicked: (chromeTab: chrome.tabs.Tab, ts: Tabset, folder?: Tabset, additionalData?: object) => Promise<ExecutionResult<any>>

  updateInTabset: (chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object) => Promise<ExecutionResult<any>>

  handleOpenedTab: (browserTab: chrome.tabs.Tab, tab: Tab) => void
}



