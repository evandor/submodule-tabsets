import { Tabset } from 'src/tabsets/models/Tabset'

export type ActionProps = {
  tabset: Tabset
  folder?: Tabset
  currentChromeTab?: chrome.tabs.Tab
  level: 'root' | 'folder'
}
