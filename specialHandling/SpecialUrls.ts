import {AddUrlToTabsetHandlers} from "src/tabsets/specialHandling/AddUrlToTabsetHandlers";
import {QVueGlobals} from "quasar";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import {RssFolderHandler} from "src/tabsets/specialHandling/handler/RssFolderHandler";

export function useUrlHandlers($q: QVueGlobals | undefined) {

  const handlerRepo = new AddUrlToTabsetHandlers($q)

  function getHandler(url?: string, content?: string, folder?: Tabset) {
    console.log(`getHandler for '${url}', content#=${content?.length}, folderId=${folder?.id}`)
    if (folder && folder.type === TabsetType.RSS_FOLDER) {
      return new RssFolderHandler($q)
    }
    const handler = url ? handlerRepo.handlerFor(url, content || '') : handlerRepo.defaultAddUrlToTabsetHandler
    console.log("getting url handler for ", url, handler)
    return handler
  }

  return {
    getHandler
  }
}
