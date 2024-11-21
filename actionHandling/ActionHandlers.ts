import {QVueGlobals} from "quasar";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import {AddUrlToTabsetHandlers} from "src/tabsets/actionHandling/AddUrlToTabsetHandlers";
import {RssFolderHandler} from "src/tabsets/actionHandling/handler/RssFolderHandler";
import {ActionHandlerButtonClickedHolder} from "src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder";
import {AddUrlToTabsetHandler, ButtonActions} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {useContentStore} from "src/content/stores/contentStore";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {LoadDynamicTabsCommand} from "src/tabsets/commands/LoadDynamicTabsCommand";

export function useActionHandlers($q: QVueGlobals | undefined) {

  const actionHandlerRepo = new AddUrlToTabsetHandlers($q)

  function getHandler(url?: string, folder?: Tabset):AddUrlToTabsetHandler {
    //console.log(`getHandler for '${url}', folderId=${folder?.id}`)
    if (folder && folder.type === TabsetType.RSS_FOLDER) {
      return new RssFolderHandler($q)
    }
    const content = useContentStore().getCurrentTabContent
    const handler = url ? actionHandlerRepo.handlerFor(url, content || '', folder) : actionHandlerRepo.defaultAddUrlToTabsetHandler
    console.log("getting url handler for ", url, handler)
    return handler
  }

  async function handleClick(tabset: Tabset, chromeTab: chrome.tabs.Tab, args: ActionHandlerButtonClickedHolder, folder: Tabset | undefined) {
    const handler = args.actionHandler
    console.log("handleClick: ", tabset.id, handler, args.actionContext?.identifier)
    switch (args.actionContext?.identifier) {
      case ButtonActions.AddTab:
        await handler.clicked(chromeTab, tabset, folder, {})
        break;
      case ButtonActions.AddTabWithDynamicFolder:
        handler.withDialog(args.actionContext?.identifier)?.onOk((data: string[]) => {
          console.log("data", data)
          handler.clicked(chromeTab, tabset, undefined, {useForLinks: (data.indexOf('useForLinks') >= 0)})
        })
        break;
      case ButtonActions.NewFile:
        handler.withDialog(args.actionContext?.identifier)?.onOk((filename: string) => {
          handler.clicked(chromeTab, tabset, undefined, {filename})
        })
        break;
      case ButtonActions.Save:
        await handler.updateInTabset(chromeTab, tabset, args.additionalData)
        break;
      case ButtonActions.SaveAs:
        handler.withDialog(args.actionContext?.identifier)?.onOk((filename: string) => {
          handler.clicked(chromeTab, tabset, undefined, {filename})
        })
        break;
      case ButtonActions.DynamicLoad:
        console.log(`loading dynamic data for tabset/folder ${tabset.id}/${args['folder' as keyof object]} `)
        await useCommandExecutor().execute(new LoadDynamicTabsCommand(tabset, args['folder' as keyof object]))
        break;
      case ButtonActions.AddRssFeed:
        console.log("===>", args.actionContext)
        handler.withDialog(args.actionContext?.identifier)?.onOk((data: { b: boolean, s: string }) => {
          console.log("in", data)
          handler.clicked(chromeTab, tabset, undefined, data)
        })
        break;
      case ButtonActions.LoadRssFeed:
        await handler.clicked(chromeTab, tabset, folder, {})
        break;
      // case ButtonActions.ClearCanvas:
      //   await handler.clicked(chromeTab, tabset, folder, {})
      //   break;
      default:
        console.log("no action defined for ", args.actionContext?.identifier)

    }
  }

  return {
    getHandler,
    handleClick
  }
}
