import {DialogChainObject, QVueGlobals, uid} from "quasar";
import {Tabset} from "src/tabsets/models/Tabset";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab, UrlExtension} from "src/tabsets/models/Tab";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import BrowserApi from "src/app/BrowserApi";
import {useUtils} from "src/core/services/Utils";
import * as cheerio from 'cheerio';

const {sanitizeAsPlainText} = useUtils()

export class RssFolderHandler implements AddUrlToTabsetHandler {


  constructor(public $q: QVueGlobals | undefined) {
  }

  urlMatcher(): RegExp {
    return /.*\.rss$/;
  }

  contentMatcher(content: string) {
    return true
  }

  actions(): { label: string, identifier: ButtonActions }[] {
    return [{label: "(Re-)Load", identifier: ButtonActions.LoadRssFeed}]
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    return undefined
  }

  private getFromItem(item: any, identifier: string, def?: string) {
    const val = item.querySelector(identifier)?.innerHTML || def
    return val ? val.replace("<![CDATA[", "").replace("]]>", "") : undefined
  }

  async clicked(chromeTab: chrome.tabs.Tab, ts: Tabset, folder?: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    console.log("loading...", chromeTab.id, additionalData)
    if (!folder || !folder.dynamicUrl) {
      return Promise.reject("no folder or dynamic url set")
    }
    console.log("getting RSS feed from ", folder.dynamicUrl)

    const response = await fetch(folder.dynamicUrl)
    console.log("reponse", response)
    const data: XMLDocument = new window.DOMParser().parseFromString(await response.text(), "text/xml")
    console.log(data)

    // const is = document.evaluate("//item", document, null, XPathResult.ANY_TYPE, null)
    // console.log("is", is.)

    const items = data.querySelectorAll("item");
    // rss.value = {
    //   items: Array.from(items)
    // }
    console.log("items", items)
    Array.from(items).forEach((item: any) => {
      console.log("item", item)
      const title = this.getFromItem(item, "title", "no title")
      const url = item.querySelector("link")?.innerHTML || chromeTab.url

      const desc = sanitizeAsPlainText(this.getFromItem(item, "description"))
      const published = item.querySelector("pubDate")?.innerHTML || undefined
      const enclosure: Element | null = item.querySelector("enclosure")
      let img = enclosure ? enclosure.getAttribute("url") : undefined
      if (!img) {
        const snippet = "<p>" + this.getFromItem(item, "description") + "</p>"
        console.log("snippet", snippet)
        var $ = cheerio.load(snippet)
        img = $('p').find('img').attr('src')
      }

      const newTab = new Tab(uid(), BrowserApi.createChromeTabObject(title, url))
      newTab.description = desc
      newTab.image = img || ''
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
