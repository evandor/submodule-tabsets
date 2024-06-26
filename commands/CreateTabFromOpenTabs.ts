import Command from "src/core/domain/Command";
import TabsetService from "src/tabsets/services/TabsetService";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import _ from "lodash";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useUiStore} from "src/ui/stores/uiStore";
import {Tabset} from "src/tabsets/models/Tabset";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {DeleteTabCommand} from "src/domain/tabs/DeleteTabCommand";
import AppEventDispatcher from "src/services/AppEventDispatcher";

const {saveCurrentTabset} = useTabsetService()

class UndoCommand implements Command<any> {

  constructor(public tab: Tab, public tabset: Tabset) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.info(this.tab, "execution undo command")
    return new DeleteTabCommand(this.tab, this.tabset).execute()
      .then((res: any) => Promise.resolve(new ExecutionResult(res, "Tab was deleted again")))
  }

}

export class CreateTabFromOpenTabsCommand implements Command<any> {

  constructor(public tab: Tab, public newIndex: number) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    console.info(this.tab, 'adding tab by d&d')
    //console.log("tabs", tabsStore.getCurrentTabs)
    const exists = _.findIndex(useTabsetsStore().getCurrentTabs, (t: any) => t.url === this.tab.url) >= 0

    let useIndex = this.newIndex
    console.log("exists", exists)

    const currentTabset: Tabset | undefined = useTabsetsStore().getCurrentTabset

    if (!exists) {
      if (!this.tab.tags) {
        this.tab.tags = []
      }

      return TabsetService.saveToCurrentTabset(this.tab, useIndex)
        .then((res) => {
          if (this.tab.url) {
            useUiStore().clearHighlights()
            useUiStore().addHighlight(this.tab.url)
            const currentTsId = useTabsetsStore().currentTabsetId
            if (currentTsId) {
              // useSearchStore().update(this.tab.url, 'name', this.newName)
              AppEventDispatcher.dispatchEvent('add-to-index', {
                name: '',
                title: this.tab.title || '',
                url: this.tab.url || '',
                description: this.tab.description,
                content: '',
                tabsets: [currentTsId],
                favIconUrl: this.tab.favIconUrl || ''
              })
            }
          }
          return res
        })
        .then((res) => {
          // if (tabsStore.pendingTabset) {
          //   tabsStore.pendingTabset.tabs = _.filter(tabsStore.pendingTabset.tabs, t => t.url !== this.tab.url)
          // }
        })
        .then((res) => {

          if (currentTabset) {
            return TabsetService.getContentFor(this.tab)
              .then((content) => {
                if (content) {
                  return useTabsetService()
                    .saveText(this.tab, content['content' as keyof object], content['metas' as keyof object])
                    .then((res) => {
                      return new ExecutionResult("result", "Tab was added",
                        new Map([["Undo", new UndoCommand(this.tab, currentTabset)]]))
                    })
                } else {
                  return saveCurrentTabset()
                    .then(result => new ExecutionResult(result, "Tab was added",
                      new Map([["Undo", new UndoCommand(this.tab, currentTabset)]])))
                }
              })
          } else {
            return Promise.reject("could not determine current tabset")
          }
        })
    } else {
      const oldIndex = _.findIndex(useTabsetsStore().getCurrentTabs, (t: any) => t.id === this.tab.id)
      if (oldIndex >= 0) {
        const tab = useTabsetsStore().getCurrentTabs.splice(oldIndex, 1)[0];
        useTabsetsStore().getCurrentTabs.splice(useIndex, 0, tab);
      }
      return saveCurrentTabset()
        .then(result => new ExecutionResult(
          result,
          "Tab was added",
          new Map([["Undo", new UndoCommand(this.tab, currentTabset || null as unknown as Tabset)]])))
    }


  }


}

CreateTabFromOpenTabsCommand.prototype.toString = function cmdToString() {
  return `CreateTabFromOpenTabs: {tab=${this.tab.toString()}}`;
};
