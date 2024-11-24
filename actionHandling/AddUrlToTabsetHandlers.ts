import {QVueGlobals} from "quasar";
import {DefaultAddUrlToTabsetHandler} from "src/tabsets/actionHandling/handler/DefaultAddUrlToTabsetHandler";
import {ExcalidrawAddUrlToTabsetHandler} from "src/tabsets/actionHandling/handler/ExcalidrawAddUrlToTabsetHandler";
import {MarkdownFileAddUrlToTabsetHandler} from "src/tabsets/actionHandling/handler/MarkdownFileAddUrlToTabsetHandler";
import {AddUrlToTabsetHandler} from "src/tabsets/actionHandling/AddUrlToTabsetHandler";
import {RssUrlAddUrlToTabsetHandler} from "src/tabsets/actionHandling/handler/RssUrlAddUrlToTabsetHandler";
import {
  FileProtocolUrlAddUrlToTabsetHandler
} from "src/tabsets/actionHandling/handler/FileProtocolUrlAddUrlToTabsetHandler";
import {Tabset} from "src/tabsets/models/Tabset";
import {TtlUrlAddUrlToTabsetHandler} from "src/tabsets/actionHandling/handler/TtlUrlAddUrlToTabsetHandler";

export class AddUrlToTabsetHandlers {

  defaultAddUrlToTabsetHandler = new DefaultAddUrlToTabsetHandler()

  handlers: AddUrlToTabsetHandler[] = []

  constructor(public quasar: QVueGlobals | undefined) {
    // this.handlers.push(new DynamicUrlAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new ExcalidrawAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new MarkdownFileAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new RssUrlAddUrlToTabsetHandler(this.quasar))
    // this.handlers.push(new TtlUrlAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new FileProtocolUrlAddUrlToTabsetHandler(this.quasar))
  }

  handlerFor(url: string, content: string, folder?: Tabset): AddUrlToTabsetHandler {
    const handler = this.handlers.filter((h: AddUrlToTabsetHandler) => url.match(h.urlMatcher()) || h.contentMatcher(content))
    if (handler && handler.length > 0) {
      //handler[0].setFolder(folder)
      return handler[0]
    }
    return this.defaultAddUrlToTabsetHandler
  }
}
