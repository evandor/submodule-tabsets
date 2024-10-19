import {AddUrlToTabsetHandlers} from "src/tabsets/specialHandling/AddUrlToTabsetHandlers";
import {QVueGlobals} from "quasar";

export function useUrlHandlers($q: QVueGlobals | undefined) {

  const handlerRepo = new AddUrlToTabsetHandlers($q)

  function getHandler(url: string | undefined) {
    const handler = url ? handlerRepo.handlerFor(url) : handlerRepo.defaultAddUrlToTabsetHandler
    console.log("getting url handler for ", url, handler)
    return handler
  }

  return {
    getHandler
  }
}
