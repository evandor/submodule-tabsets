import {DialogChainObject, QVueGlobals, uid} from "quasar";
import {Tabset} from "src/tabsets/models/Tabset";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab, UrlExtension} from "src/tabsets/models/Tab";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import BrowserApi from "src/app/BrowserApi";
import * as cheerio from 'cheerio';
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {ActionContext} from "src/tabsets/actionHandling/model/ActionContext";
import {parseFeed} from '@rowanmanning/feed-parser';

export class RssFolderHandler implements AddUrlToTabsetHandler {


  constructor(public $q: QVueGlobals | undefined) {
  }

  urlMatcher(): RegExp {
    return /.*\.rss$/;
  }

  contentMatcher(content: string) {
    return true
  }

  actions(): ActionContext[] {
    return [new ActionContext("(Re-)Load", ButtonActions.LoadRssFeed)]
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    return undefined
  }

  async clicked(chromeTab: chrome.tabs.Tab, ts: Tabset, folder?: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    console.log("loading...", chromeTab.id, additionalData)
    if (!folder || !folder.dynamicUrl) {
      return Promise.reject("no folder or dynamic url set")
    }
    console.log("getting RSS feed from ", folder.dynamicUrl)

    const response = await fetch(folder.dynamicUrl)
    const responseText = await response.text()
    //console.log("reponse", responseText)

    const feed = parseFeed(responseText);
    console.log(JSON.stringify(feed));

    // const data: XMLDocument = new window.DOMParser().parseFromString(responseText, "text/xml")
    // console.log(data)

    // const is = document.evaluate("//item", document, null, XPathResult.ANY_TYPE, null)
    // console.log("is", is.)

    // const items = data.querySelectorAll("item");
    // rss.value = {
    //   items: Array.from(items)
    // }
    //console.log("items", items)
    Array.from(feed.items).forEach((item: any) => {
      console.log("item", item)
      //const title = additionalData['feedname'] || 'no title' //this.getFromItem(item, "title", "no title")
      const title = item.title
      const url = item.url

      const desc = item.description || ''
      const published = item.published //item.querySelector("pubDate")?.innerHTML || undefined
      //const enclosure: Element | null = item.querySelector("enclosure")
      let img = item.image?.url //enclosure ? enclosure.getAttribute("url") : undefined
      console.log("img", img)
      if (!img) {
        const snippet = item.content
        console.log("snippet", snippet)
        var $ = cheerio.load(snippet)
        img = $('img').attr('src')
        console.log("img set to", img)
      }

      const newTab = new Tab(uid(), BrowserApi.createChromeTabObject(title || '', url || ''))
      newTab.description = desc
      newTab.image = img
      newTab.extension = UrlExtension.RSS
      if (published) {
        newTab.created = new Date(published).getTime()
      }
      useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, folder?.id, false, true))
        .catch((error: any) => {
        })
    })
    return Promise.resolve(new ExecutionResult("", ""))
  }

  updateInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    throw new Error("not implemented L")
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {

  }


}
