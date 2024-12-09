import {DialogChainObject, QVueGlobals, uid} from "quasar";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {CreateFolderCommand} from "src/tabsets/commands/CreateFolderCommand";
import {ActionContext} from "src/tabsets/actionHandling/model/ActionContext";
import AddRssFeedDialog from "src/tabsets/dialogues/actions/AddRssFeedDialog.vue";

export class RssUrlAddUrlToTabsetHandler implements AddUrlToTabsetHandler {

  constructor(public $q: QVueGlobals | undefined) {
  }

  urlMatcher(): RegExp {
    return /.*\.rss$/;
  }

  contentMatcher(content: string) {
    //console.log("content", content.indexOf("<feed "), content)
    return content.indexOf("<rss ") >= 0 ||
      content.indexOf("<rdf:RDF ") >= 0 ||
      content.indexOf("<feed ") >= 0 ||
      content.indexOf("&lt;feed ") >= 0
  }

  actions():  ActionContext[] {
    return [new ActionContext("Add RSS Feed", ButtonActions.AddRssFeed)]
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    switch (action) {
      case ButtonActions.AddRssFeed:
        return this.storeAsFeed()
      default:
        console.log("no dialog for action", action)
    }
  }

  async clicked(chromeTab: chrome.tabs.Tab, ts: Tabset, folder?: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    console.log("saving...", chromeTab, additionalData)
    try {
      const displayFeed = additionalData['displayFeed' as keyof object] as boolean
      const newTab = new Tab(uid(), chromeTab)
      if (displayFeed) {
        // let title = chromeTab.url?.replace("https://","").replace("http://", "").replace(STRIP_CHARS_IN_USER_INPUT, '') || 'no title'
        let title: string = additionalData['feedName' as keyof object] || 'no title'
        if (title.length > 32) {
          title = title.substring(0,28) + "..."
        }
        await useCommandExecutor().executeFromUi(new CreateFolderCommand(uid(), title, [], ts.id, undefined, chromeTab.url, TabsetType.RSS_FOLDER))
      } else {
        await useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(newTab, ts, ts.folderActive))
      }
      return Promise.resolve(new ExecutionResult("", "done"))
    } catch (error: any) {
      console.warn("error", error)
      return Promise.reject("error creating RSS Feed")
    }

  }

  updateInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    throw new Error("not implemented M")
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {

  }

  storeAsFeed(): DialogChainObject | undefined {
    if (this.$q) {

      return this.$q.dialog({
        component: AddRssFeedDialog,
        componentProps: {parentFolderId: "bookmarkId.value"}
      })

      // return this.$q!.dialog({
      //   title: 'Display RSS Feed?',
      //   message: 'This file seems to contain an RSS Feed',
      //   options: {
      //     type: 'checkbox',
      //     model: [],
      //     items: [
      //       {label: 'Display Feed', value: 'displayFeed', color: 'secondary'},
      //     ]
      //   },
      //   cancel: true,
      //   persistent: true
      // })
    } else {
      console.warn("could not display storeAsFeed, quasar not set")
    }
  }
}
