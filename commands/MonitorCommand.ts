import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { MonitoredTab } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class MonitorCommand implements Command<any> {
  constructor(
    public tabId: string,
    public setActive: boolean,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabset = useTabsetsStore().getCurrentTabset
    if (!tabset || this.tabId === null) {
      return Promise.reject('could not get current tabset')
    }
    if (!tabset.monitoredTabs) {
      tabset.monitoredTabs = []
    }
    if (this.setActive) {
      tabset.monitoredTabs.push({ tabId: this.tabId })
      tabset.monitoredTabs = [...new Set(tabset.monitoredTabs)]
    } else {
      tabset.monitoredTabs = tabset.monitoredTabs.filter((mt: MonitoredTab) => mt.tabId !== this.tabId)
    }
    return useTabsetService()
      .saveTabset(tabset)
      .then(() => {
        Analytics.fireEvent('tabset_tab_monitor_started', {})
        return new ExecutionResult('done', this.setActive ? 'tab is being monitored now' : 'Monitoring of tab stopped')
      })
  }
}

MonitorCommand.prototype.toString = function cmdToString() {
  return `MonitorCommand: {tabId=${this.tabId}}`
}
