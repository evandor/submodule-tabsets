import {DialogChainObject, QVueGlobals, uid} from "quasar";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";
import {CreateFolderCommand} from "src/tabsets/commands/CreateFolderCommand";
import * as cheerio from "cheerio";
import {useContentStore} from "src/content/stores/contentStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";

export class RssUrlAddUrlToTabsetHandler implements AddUrlToTabsetHandler {

  constructor(public $q: QVueGlobals | undefined) {
  }

  urlMatcher(): RegExp {
    return /.*\.rss$/;
  }

  contentMatcher(content: string) {
    return content.indexOf("<rss ") >= 0
  }

  actions(): { label: string, identifier: ButtonActions }[] {
    return [{label: "Add RSS Feed", identifier: ButtonActions.AddRssFeed}]
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
    console.log("saving...", chromeTab.id, additionalData)
    try {
      const displayFeed = additionalData['displayFeed' as keyof object] as boolean
      const newTab = new Tab(uid(), chromeTab)
      if (displayFeed) {
        let title = chromeTab.url.replace("https://","").replace("http://", "").replace(STRIP_CHARS_IN_USER_INPUT, '')
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
    throw new Error("not implemented")
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {

  }

  storeAsFeed() {
    if (this.$q) {
      return this.$q!.dialog({
        title: 'Display RSS Feed?',
        message: 'This file seems to contain an RSS Feed',
        options: {
          type: 'checkbox',
          model: [],
          items: [
            {label: 'Display Feed', value: 'displayFeed', color: 'secondary'}
          ]
        },
        cancel: true,
        persistent: true
      })
    } else {
      console.warn("could not display storeAsFeed, quasar not set")
    }
  }
}
