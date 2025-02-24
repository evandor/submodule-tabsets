import { Tabset } from 'src/tabsets/models/Tabset'

export type ActionProps = {
  tabset: Tabset
  folder?: Tabset
  level: 'root' | 'folder'
}
