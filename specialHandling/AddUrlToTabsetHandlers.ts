import _ from "lodash";
import {
  AddUrlToTabsetHandler,
  DefaultAddUrlToTabsetHandler
} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";
import {ExcalidrawAddUrlToTabsetHandler} from "src/tabsets/specialHandling/handler/ExcalidrawAddUrlToTabsetHandler";

export class AddUrlToTabsetHandlers {

  defaultAddUrlToTabsetHandler = new DefaultAddUrlToTabsetHandler()

  handlers: AddUrlToTabsetHandler[] = [
    new ExcalidrawAddUrlToTabsetHandler()
  ]

  handlerFor(url: string): AddUrlToTabsetHandler {
    const specialHandler = _.find(this.handlers, (h: AddUrlToTabsetHandler) => h.matches() === url);
    return specialHandler ? specialHandler : this.defaultAddUrlToTabsetHandler
  }
}
