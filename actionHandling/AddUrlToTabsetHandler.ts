import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { Component } from 'vue'

export type AddUrlToTabsetHandlerAdditionalData = {
  action?: ActionContext
  dialog?: object
  data?: {
    useForLinks?: boolean
    displayFeed?: boolean
    recursive?: boolean
    filename?: string
    more?: object
  }
}

export type ClickedHandler = (
  browserTab: chrome.tabs.Tab,
  ts: Tabset,
  folder?: Tabset,
  additionalData?: AddUrlToTabsetHandlerAdditionalData,
) => Promise<ExecutionResult<any>>

export type ComponentContext = {
  label?: string
  chromeTab?: chrome.tabs.Tab
}

export type ComponentWithContext = {
  component: Component
  context: ComponentContext
}

export interface AddUrlToTabsetHandler {
  tabMatcher(url: string, content: string, metas: object): boolean

  injectScript: () => Promise<void>

  //defaultAction: () => ActionContext | undefined

  actions: (currentTabsetId: string | undefined, actionProps: ActionProps) => ComponentWithContext[]

  //clicked: ClickedHandler

  //updateInTabset: ClickedHandler

  handleOpenedTab: (browserTab: chrome.tabs.Tab, tab: Tab) => void
}
