import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useUtils } from 'src/core/services/Utils'
import { useLogger } from 'src/services/Logger'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetSharing } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

const { addToTabset, deleteTab } = useTabsetService()
const { sendMsg } = useUtils()
const { info } = useLogger()

class UndoCommand implements Command<any> {
  constructor(
    public tabset: Tabset,
    public tab: Tab,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    console.log('execution undo command', this.tab, this.tabset)
    return addToTabset(this.tabset, this.tab).then((res) => {
      useTabsetService().saveCurrentTabset()
      return new ExecutionResult(res, 'Tab has been restored again')
    })
  }
}

export class DeleteTabCommand implements Command<Tabset> {
  constructor(
    public tab: Tab,
    public tabset: Tabset,
  ) {}

  async execute(): Promise<ExecutionResult<Tabset>> {
    return deleteTab(this.tab, this.tabset)
      .then((tabset: Tabset) => {
        // sharing
        if (tabset.sharedId && tabset.sharing === TabsetSharing.PUBLIC_LINK) {
          tabset.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
          tabset.sharedAt = new Date().getTime()
        }
        return tabset
      })
      .then((tabset: Tabset) => {
        info('tab deleted')
        return tabset
      })
      .then((tabset) =>
        Promise.resolve(
          new ExecutionResult(tabset, 'Tab was deleted', new Map([['Undo', new UndoCommand(tabset, this.tab)]])),
        ),
      )
      .then((res) => {
        sendMsg('tab-deleted', { tabsetId: res.result.id })
        return res
      })
      .catch((err) => Promise.reject(err))
  }
}

DeleteTabCommand.prototype.toString = function cmdToString() {
  return `DeleteTabCommand: {tab.id=${this.tab.id}, tab.url=${this.tab.url}}`
}
