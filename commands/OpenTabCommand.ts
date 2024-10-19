import Command from "src/core/domain/Command";
import {useNavigationService} from "src/navigation/services/NavigationService";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {ref} from "vue";
import {AddUrlToTabsetHandler} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";
import {useUrlHandlers} from "src/tabsets/specialHandling/SpecialUrls";
import {Tab} from "src/tabsets/models/Tab";

const {getHandler} = useUrlHandlers(undefined)

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
