import { QVueGlobals } from 'quasar'
import { AddUrlToTabsetHandler } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { DefaultAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/DefaultAddUrlToTabsetHandler'
import { ExcalidrawAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/ExcalidrawAddUrlToTabsetHandler'
import { FileProtocolUrlAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/FileProtocolUrlAddUrlToTabsetHandler'
import { ImportFromChromeBookmarksManagerAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/ImportFromChromeBookmarksManagerAddUrlToTabsetHandler'
import { MarkdownFileAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/MarkdownFileAddUrlToTabsetHandler'
import { ObsidianApiAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/ObsidianApiAddUrlToTabsetHandler'
import { RapidApiAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/RapidApiAddUrlToTabsetHandler'
import { RssUrlAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/RssUrlAddUrlToTabsetHandler'
import { Tabset } from 'src/tabsets/models/Tabset'

export class AddUrlToTabsetHandlers {
  defaultAddUrlToTabsetHandler = new DefaultAddUrlToTabsetHandler(null as unknown as QVueGlobals)

  handlers: AddUrlToTabsetHandler[] = []

  constructor(public quasar: QVueGlobals | undefined) {
    // this.handlers.push(new DynamicUrlAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new ExcalidrawAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new ObsidianApiAddUrlToTabsetHandler())
    this.handlers.push(new RapidApiAddUrlToTabsetHandler())
    this.handlers.push(new MarkdownFileAddUrlToTabsetHandler(this.quasar!))
    this.handlers.push(new ImportFromChromeBookmarksManagerAddUrlToTabsetHandler(this.quasar!))
    this.handlers.push(new RssUrlAddUrlToTabsetHandler(this.quasar!))
    // this.handlers.push(new TtlUrlAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new FileProtocolUrlAddUrlToTabsetHandler(this.quasar))
  }

  handlerFor(url: string, content: string, folder?: Tabset): AddUrlToTabsetHandler {
    // console.log(`checking handler for ${url}`)
    const handler = this.handlers.filter(
      (h: AddUrlToTabsetHandler) => url.match(h.urlMatcher()) || h.contentMatcher(content),
    )
    if (handler && handler.length > 0) {
      //handler[0].setFolder(folder)
      return handler[0]!
    }
    return new DefaultAddUrlToTabsetHandler(this.quasar!)
  }
}
