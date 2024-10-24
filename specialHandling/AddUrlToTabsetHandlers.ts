import {AddUrlToTabsetHandler} from "src/tabsets/specialHandling/AddUrlToTabsetHandler";
import {QVueGlobals} from "quasar";
import {ExcalidrawAddUrlToTabsetHandler} from "src/tabsets/specialHandling/handler/ExcalidrawAddUrlToTabsetHandler";
import {DefaultAddUrlToTabsetHandler} from "src/tabsets/specialHandling/handler/DefaultAddUrlToTabsetHandler";
import {MarkdownFileAddUrlToTabsetHandler} from "src/tabsets/specialHandling/handler/MarkdownFileAddUrlToTabsetHandler";
import {RssUrlAddUrlToTabsetHandler} from "src/tabsets/specialHandling/handler/RssUrlAddUrlToTabsetHandler";

export class AddUrlToTabsetHandlers {

  defaultAddUrlToTabsetHandler = new DefaultAddUrlToTabsetHandler()

  handlers: AddUrlToTabsetHandler[] = []

  constructor(public quasar: QVueGlobals | undefined) {
    this.handlers.push(new ExcalidrawAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new MarkdownFileAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new RssUrlAddUrlToTabsetHandler(this.quasar))
  }

  handlerFor(url: string, content: string): AddUrlToTabsetHandler {
    const handler = this.handlers.filter((h: AddUrlToTabsetHandler) => url.match(h.urlMatcher()) || h.contentMatcher(content))
    return handler && handler.length > 0 ? handler[0] : this.defaultAddUrlToTabsetHandler
  }
}
