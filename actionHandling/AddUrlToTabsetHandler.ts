import { DialogChainObject } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'

export enum ButtonActions {
  AddTab = 'AddTab',
  OpenTab = 'OpenTab',
  AddReadingModeTab = 'AddReadingModeTab',
  AddTabWithDynamicFolder = 'AddTabWithDynamicFolder',
  NewFile = 'NewFile',
  SaveAs = 'SaveAs',
  Save = 'Save',
  DynamicLoad = 'DynamicLoad',
  AddRssFeed = 'AddRssFeed',
  LoadRssFeed = 'LoadRssFeed',
  ClearCanvas = 'ClearCanvas',
  ImportChromeBookmarks = 'ImportChromeBookmarks',
}

export type AddUrlToTabsetHandlerAdditionalData = {
  action?: {
    identifier: ButtonActions
    label: string
  }
  data?: {
    useForLinks?: boolean
    displayFeed?: boolean
    recursive?: boolean
    filename?: string
    more?: object
  }
}

export interface AddUrlToTabsetHandler {
  urlMatcher: () => RegExp

  contentMatcher: (content: string) => boolean

  actions: () => ActionContext[]

  withDialog: (action: ButtonActions) => DialogChainObject | undefined

  clicked: (
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ) => Promise<ExecutionResult<any>>

  updateInTabset: (
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData,
  ) => Promise<ExecutionResult<any>>

  handleOpenedTab: (browserTab: chrome.tabs.Tab, tab: Tab) => void
}
