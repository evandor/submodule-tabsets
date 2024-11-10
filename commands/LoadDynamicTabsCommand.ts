import Command from "src/core/domain/Command";
import {Tabset} from "src/tabsets/models/Tabset";
import {ExecutionFailureResult, ExecutionResult} from "src/core/domain/ExecutionResult";
import {fromMarkdown} from 'mdast-util-from-markdown'
import {uid} from "quasar";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import * as cheerio from "cheerio";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {CreateFolderCommand} from "src/tabsets/commands/CreateFolderCommand";

export class LoadDynamicTabsCommand implements Command<any> {

  public merge: boolean = true

  constructor(
    private tabset: Tabset,
    private folder?: Tabset
  ) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    if (!this.tabset.dynamicUrl && !this.folder?.dynamicUrl) {
      return Promise.resolve(new ExecutionFailureResult("", "not a dynamic tabset/folder"))
    }
    const dynamicUrl: string = this.folder?.dynamicUrl ? this.folder.dynamicUrl! : this.tabset.dynamicUrl!
    //const folderOrTabset: Tabset = this.folder ? this.folder : this.tabset
    if (dynamicUrl.endsWith(".md")) {
      const doc = await fetch(dynamicUrl)
      const body = await doc.text()
      const tree = fromMarkdown(body)
      console.log("tree", JSON.stringify(tree,null,2))
      this.folder
        ? this.folder.tabs = []
        : this.tabset.tabs = []
      //this.parseLinks("ROOT", tree)

      let level = 0
      let folderByLevel: Tabset[] = [this.folder ? this.folder : this.tabset]
      console.log("===>", folderByLevel.map(e => e.id))
      let freshFolder = false
      const f = ({type = "unknown", depth=0, value = "", title = "", children = {}}, folder?: Tabset): {
        type: string,
        depth: number,
        value: string,
        title: string,
        folder: Tabset | undefined,
        children: object
      } => {
        return {
          type,
          depth,
          value,
          title,
          folder,
          children: Object.values(children)
            .filter((elem: any) => {
              return elem.type === "heading" || elem.type === "text" || elem.type === "link" || elem.type === "paragraph"
            })
            .map((elem: any) => {
              //console.log("in", type, depth, folder)
              if (elem.type === "heading" && elem.depth) {
                const folder = new Tabset(uid(), "xxx")
                freshFolder = true
                if (elem.depth > level) {
                  console.log(`create new folder +1, depth ${elem.depth}, level: ${level}, folderId: ${folder.id}, parentId: ${folderByLevel[level].id}`)
                  folder.folderParent = folderByLevel[level].id
                  level = elem.depth
                  folderByLevel[level] = folder
                  return f(elem, folder)
                } else if (elem.depth === level) {
                  console.log(`create new folder 0, depth ${elem.depth}, level: ${level}, folderId: ${folder.id}, parentId: ${folderByLevel[level].id}`)
                  folder.folderParent = folderByLevel[level-1].id
                  return f(elem, folder)
                } else if (elem.depth < level) {
                  console.log(`create new folder -1, depth ${elem.depth}, level: ${level}, folderId: ${folder.id}, parentId: ${folderByLevel[level].id}`)
                  level = elem.depth
                  folder.folderParent = folderByLevel[elem.depth-1].id
                  return f(elem, folder)
                }
              } else {
                if (freshFolder && elem.type === "text" && folder) {
                  folder.name = elem.value
                  freshFolder = false
                }
                return f(elem, undefined)
              }

            })
        }
      }
      //const iteration1 = f(tree)
      console.log("===>", folderByLevel.map(e => e.id))
      //console.log("iteration1", JSON.stringify(iteration1,null,2))

      const foldersToCreate : Tabset[] = []
      const g = ({type = "unknown", value = "", title = "", children = {}}, folder?: Tabset): {
        type: string,
        value: string,
        title: string,
        folder: Tabset | undefined,
        children: object
      } => {

        return {
          type,
          value,
          title,
          folder,
          children: Object.values(children)
            .filter((elem: any) => {
              // console.log(`in ${elem.type},${elem.folder}: ${(elem.type === "root" || elem.folder !== undefined)}`, )
              return  elem.type === "root" || elem.folder !== undefined
            })
            .map((elem: any) => {
              console.log("---new folder---:", elem.folder.id)
              if (elem.folder) {
                const f:Tabset = elem.folder
                foldersToCreate.push(f)
              }
              return g(elem)
            })
        }
      }
      //const iteration2 = g(iteration1)
      //console.log("iteration2", iteration2)

      for (const f of foldersToCreate) {
        console.log(`createing folder id: ${f.id}, parentId: ${f.folderParent}`)
        await useCommandExecutor().execute(new CreateFolderCommand(f.id, f.name, [], this.tabset.id, f.folderParent))
      }

      //console.log("tabsets.tabs", this.tabset.tabs.length)
      await useTabsetsStore().saveTabset(this.tabset)

      return Promise.resolve(new ExecutionResult("", ""))
    } else if (dynamicUrl.endsWith(".rss")) {

      // const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"
      //
      // let parser = new Parser();
      // await parser.parseURL(CORS_PROXY + 'https://www.reddit.com/.rss', function (err, feed) {
      //   if (err) throw err;
      //   console.log(feed.title);
      //   feed.items.forEach(function (entry) {
      //     console.log(entry.title + ':' + entry.link);
      //   })
      // })

      // const doc = await fetch(dynamicUrl)
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
    } else if (dynamicUrl.startsWith("https://www.youtube.com/watch")) {
      const doc = await fetch(dynamicUrl)
      const body = await doc.text()
      console.log("body", body)
      const $ = cheerio.load(body);
      // #description-inline-expander
      //  const segment = $('#description-inline-expander')
      //  console.log("segment", segment)
      //  for (const elem of segment._findBySelector('a',100)) {
      //    console.log("elem", elem)
      //  }
      const links = $("#description-inline-expander a")
      console.log("links", links)
      // const t = new Tab(uid(), ChromeApi.createChromeTabObject(heading + ": " + title, n.url, ""))
      // this.tabset.tabs.push(t)

      return Promise.resolve(new ExecutionResult("", "xxx"))
    } else {
      return Promise.resolve(new ExecutionFailureResult("", "must be a markdown, rss or a youtube 'watch' link"))
    }

  }

}

// LoadDynamicTabsCommand.prototype.toString = function cmdToString() {
//   return `LoadDynamicTabsCommand: tabsetId=${this.tabset.id}, dynamicUrl=${dynamicUrl}}`;
// };
