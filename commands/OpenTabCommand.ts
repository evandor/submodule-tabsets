import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {ref} from "vue";
import {Tab} from "src/tabsets/models/Tab";
import {useNavigationService} from "src/core/services/NavigationService";
import {AddUrlToTabsetHandler} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {useActionHandlers} from "src/tabsets/actionHandling/ActionHandlers";

const {getHandler} = useActionHandlers(undefined)

export class OpenTabCommand implements Command<string> {

  constructor(public tab: Tab) {
  }

  async execute() {
    try {
      const handler = ref<AddUrlToTabsetHandler>(getHandler(this.tab.url!))
      const browserTab = await useNavigationService().browserTabFor(this.tab.url!)
      handler.value.handleOpenedTab(browserTab, this.tab)
      //useContentStore().currentTabId = this.tab.id
      await chrome.tabs.highlight({tabs: browserTab.index})
      return Promise.resolve(new ExecutionResult("", "opened"))
    } catch (err: any) {
      return Promise.reject(err)
    }
  }

}


OpenTabCommand.prototype.toString = function cmdToString() {
  return `OpenTabCommand: {tab=${this.tab.id}}`;
};
