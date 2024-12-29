import { DialogChainObject, QVueGlobals, uid } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useRequestsStore } from 'src/requests/stores/requestsStore'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import AddRssFeedDialog from 'src/tabsets/dialogues/actions/AddRssFeedDialog.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'

/**
 * examples
 * https://www.test.de/rss/alles/
 * https://www.spiegel.de/sport/index.rss
 */
export class RssUrlAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals | undefined) {}

  urlMatcher(): RegExp {
    return /.*\.rss$/
  }

  contentMatcher(content: string) {
    // console.log('content', content.indexOf('<rss '), content.substring(0, 30))
    const request = useRequestsStore().getCurrentTabRequest
    if (request) {
      const contentType =
        request.responseHeaders
          ?.find((rh: chrome.webRequest.HttpHeader) => rh.name.toLowerCase() === 'content-type')
          ?.value?.toLowerCase() || 'text/html'
      // console.log('found contnt type ', contentType)
      if (contentType.indexOf('application/xml') >= 0 || contentType.indexOf('application/rss+xml')) {
        return true
      }
    }
    return (
      content.indexOf('<rss ') >= 0 ||
      content.indexOf('&lt;rss ') >= 0 ||
      content.indexOf('<rdf:RDF ') >= 0 ||
      content.indexOf('&lt;rdf:RDF ') >= 0 ||
      content.indexOf('<feed ') >= 0 ||
      content.indexOf('&lt;feed ') >= 0
    )
  }

  actions(): ActionContext[] {
    return [new ActionContext('Add RSS Feed', ButtonActions.AddRssFeed)]
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    switch (action) {
      case ButtonActions.AddRssFeed:
        return this.storeAsFeed()
      default:
        console.log('no dialog for action', action)
    }
  }

  async clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  ): Promise<ExecutionResult<any>> {
    console.log('saving...', chromeTab, additionalData)
    try {
      const displayFeed = additionalData.data!.more!['displayFeed' as keyof object] as boolean
      const newTab = new Tab(uid(), chromeTab)
      if (displayFeed) {
        // let title = chromeTab.url?.replace("https://","").replace("http://", "").replace(STRIP_CHARS_IN_USER_INPUT, '') || 'no title'
        let title: string = additionalData.data!.more!['feedName' as keyof object] || 'no title'
        if (title.length > 32) {
          title = title.substring(0, 28) + '...'
        }
        await useCommandExecutor().executeFromUi(
          new CreateFolderCommand(uid(), title, [], ts.id, undefined, chromeTab.url, TabsetType.RSS_FOLDER),
        )
      } else {
        await useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(newTab, ts, ts.folderActive))
      }
      return Promise.resolve(new ExecutionResult('', 'done'))
    } catch (error: any) {
      console.warn('error', error)
      return Promise.reject('error creating RSS Feed')
    }
  }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    throw new Error('not implemented M')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}

  storeAsFeed(): DialogChainObject | undefined {
    if (this.$q) {
      return this.$q.dialog({
        component: AddRssFeedDialog,
        componentProps: { parentFolderId: 'bookmarkId.value' },
      })

      // return this.$q!.dialog({
      //   title: 'Display RSS Feed?',
      //   message: 'This file seems to contain an RSS Feed',
      //   options: {
      //     type: 'checkbox',
      //     model: [],
      //     items: [
      //       {label: 'Display Feed', value: 'displayFeed', color: 'secondary'},
      //     ]
      //   },
      //   cancel: true,
      //   persistent: true
      // })
    } else {
      console.warn('could not display storeAsFeed, quasar not set')
    }
  }
}
