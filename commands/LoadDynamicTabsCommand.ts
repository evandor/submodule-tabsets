import Command from "src/core/domain/Command";
import {Tabset} from "src/tabsets/models/Tabset";
import {ExecutionFailureResult, ExecutionResult} from "src/core/domain/ExecutionResult";
import {fromMarkdown} from 'mdast-util-from-markdown'
import {Tab} from "src/tabsets/models/Tab";
import {uid} from "quasar";
import ChromeApi from "src/app/BrowserApi";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import Parser from 'rss-parser';

export class LoadDynamicTabsCommand implements Command<any> {

  public merge: boolean = true

  constructor(
    public tabset: Tabset) {
  }

  parseLinks(heading: string, tree: any, level = 0) {
    if (tree.children) {
      for (const n of tree.children) {
        if (n.type === "heading") {
          if (n.children && n.children.length > 0 && n.children[0].type === "text") {
            heading = n.children[0].value
          }
        } else if (n.type === "link" && (n.url.startsWith("https://") || n.url.startsWith("http://"))) {
          let title = n.title
          if (!title) {
            if (n.children && n.children.length > 0 && n.children[0].type === "text") {
              title = n.children[0].value
            }
          }
          console.log("link:", level, heading, title, n.url)

          const t = new Tab(uid(), ChromeApi.createChromeTabObject(heading + ": " + title, n.url, ""))
          this.tabset.tabs.push(t)
        }
        this.parseLinks(heading, n, level + 1)
      }
    }
  }

  async execute(): Promise<ExecutionResult<any>> {
    console.log("===>", this.toString())
    if (!this.tabset.dynamicUrl) {
      return Promise.resolve(new ExecutionFailureResult("", "not a dynamic tabset"))
    }
    if (this.tabset.dynamicUrl.endsWith(".md")) {
      const doc = await fetch(this.tabset.dynamicUrl)
      const body = await doc.text()
      const tree = fromMarkdown(body)
//    console.log(tree)
      this.tabset.tabs = []
      this.parseLinks("ROOT", tree)
      console.log("tabsets.tabs", this.tabset.tabs.length)
      await useTabsetsStore().saveTabset(this.tabset)

      return Promise.resolve(new ExecutionResult("", ""))
    } else if (this.tabset.dynamicUrl.endsWith(".rss")) {

      const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"

      let parser = new Parser();
      await parser.parseURL(CORS_PROXY + 'https://www.reddit.com/.rss', function(err, feed) {
        if (err) throw err;
        console.log(feed.title);
        feed.items.forEach(function(entry) {
          console.log(entry.title + ':' + entry.link);
        })
      })

      // const doc = await fetch(this.tabset.dynamicUrl)
      // const body = await doc.text()
      // console.log("here", body)
      //
      // const parser = new Parser();
      // const feed = await parser.parseURL('https://www.reddit.com/.rss');
      // console.log(feed.title); // feed will have a `foo` property, type as a string
      //
      // feed.items.forEach(item => {
      //   console.log(item.title + ':' + item.link) // item will have a `bar` property type as a number
      // });

      return Promise.resolve(new ExecutionResult("", "xxx"))
    } else {
      return Promise.resolve(new ExecutionFailureResult("", "must be a markdown or rss file"))
    }

  }

}

LoadDynamicTabsCommand.prototype.toString = function cmdToString() {
  return `LoadDynamicTabsCommand: tabsetId=${this.tabset.id}, dynamicUrl=${this.tabset.dynamicUrl}}`;
};
