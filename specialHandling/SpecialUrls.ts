import {AddUrlToTabsetHandlers} from "src/tabsets/specialHandling/AddUrlToTabsetHandlers";

export function useUrlHandlers() {

  const handlerRepo = new AddUrlToTabsetHandlers()

  function getHandler(url: string | undefined) {
    console.log("getting url handler for ", url)
    return url ? handlerRepo.handlerFor(url) : handlerRepo.defaultAddUrlToTabsetHandler
  }

  return {
    getHandler
  }
}
