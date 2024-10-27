import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {ref} from "vue";
import {Tab} from "src/tabsets/models/Tab";
import {useNavigationService} from "src/core/services/NavigationService";
import {AddUrlToTabsetHandler} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {useActionHandlers} from "src/tabsets/actionHandling/ActionHandlers";

const {getHandler} = useActionHandlers(undefined)

export class OpenTabCommand implements Command<string> {

  constructor(private tab: Tab) {
  }

  async execute() {
    try {
      const handler = ref<AddUrlToTabsetHandler>(getHandler(this.tab.url!))
      const browserTab = await useNavigationService().browserTabFor(this.tab.url!)
      handler.value.handleOpenedTab(browserTab, this.tab)
      await chrome.tabs.highlight({tabs: browserTab.index})
      return Promise.resolve(new ExecutionResult("", "opened"))
    } catch (err: any) {
      return Promise.reject(err)
    }
  }

}
