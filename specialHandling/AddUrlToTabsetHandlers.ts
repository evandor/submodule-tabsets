import _ from "lodash";
import {AddUrlToTabsetHandler} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";
import {QVueGlobals} from "quasar";
import {ExcalidrawAddUrlToTabsetHandler} from "src/tabsets/specialHandling/handler/ExcalidrawAddUrlToTabsetHandler";
import {DefaultAddUrlToTabsetHandler} from "src/tabsets/specialHandling/handler/DefaultAddUrlToTabsetHandler";

export class AddUrlToTabsetHandlers {

  defaultAddUrlToTabsetHandler = new DefaultAddUrlToTabsetHandler()

  handlers: AddUrlToTabsetHandler[] = []

  constructor(public quasar: QVueGlobals | undefined) {
    this.handlers.push(new ExcalidrawAddUrlToTabsetHandler(this.quasar))
  }

  handlerFor(url: string): AddUrlToTabsetHandler {
    const specialHandler = _.find(this.handlers, (h: AddUrlToTabsetHandler) => h.matches() === url);
    return specialHandler ? specialHandler : this.defaultAddUrlToTabsetHandler
  }
}
