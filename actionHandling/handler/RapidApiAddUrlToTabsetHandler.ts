import { DialogChainObject, QVueGlobals, uid } from 'quasar'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { RestParam, RestTab } from 'src/rest/models/RestTab'
import { RestApiDefinitions } from 'src/rest/RestApiDefinitions'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
  ClickedHandler,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { Component } from 'vue'

export class RapidApiAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals) {}

  urlMatcher(): RegExp {
    return /^https:\/\/rapidapi.com\/(.)*\/api\/(.)*\/playground/
  }

  contentMatcher(content: string): boolean {
    return false
  }

  defaultAction(): ActionContext {
    return new ActionContext('Add Rapid API') //.onClicked(this.clicked)
      .withDialog(this.addRapidApi, this.$q)
      .onOk(this.onOk)
  }

  actions(): Component[] {
    // new ActionContext('Add Rapid API', ButtonActions.Save)
    return []
  }

  async clicked(
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    folder: Tabset | undefined,
    additionalData: AddUrlToTabsetHandlerAdditionalData | undefined,
  ): Promise<ExecutionResult<any>> {
    console.log(`handleOpenedTab`, additionalData)

    const url = useTabsStore2().currentChromeTab?.url
    const currentTs = useTabsetsStore().getCurrentTabset

    if (url && currentTs) {
      const returned = await RapidApiAddUrlToTabsetHandler.queryBrowserTab()
      if (returned.length > 0) {
        console.log('returned', returned[0])
        const config = returned[0]!.result!
        const params = JSON.parse(config.params)
        console.log('params', Array.isArray(params.parameters), params.parameters)
        let apiParams: RestParam[] = []
        if (Array.isArray(params.parameters)) {
          apiParams = Array.from(params.parameters).map((e: any) => e as RestParam)
        }
        const host = config.apiName + '.p.rapidapi.com'
        const tab = new RestTab(
          uid(),
          config.apiName + ': ' + config.name,
          browserTab.url || '',
          'RAPID_API_WEBSITE_CATEGORIZATION',
          'https://' + host,
          config.route,
          config.method,
          [
            ['x-rapidapi-key', config.key],
            ['x-rapidapi-host', host],
          ],
          apiParams,
        )
        tab.description = config.description
        // if (config.externalDocs) {
        tab.tabReferences.push(
          new TabReference(uid(), TabReferenceType.DOCUMENTATION, 'external documentation', [], config.externalDocs),
        )
        // }
        console.log('restTab', tab)
        if (
          additionalData &&
          additionalData.dialog &&
          (additionalData.dialog as string[]).find((h) => h === 'addFolder')
        ) {
          await useCommandExecutor().execute(
            new CreateFolderCommand(uid(), 'API: ' + config.apiName, [tab], currentTs.id, currentTs.folderActive),
          )
        } else {
          await useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab, currentTs, currentTs.folderActive))
        }
      }
    }

    return Promise.reject('could not find API')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab): void {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.log(`handleOpenedTab ${browserTab}`)
  }

  // TODO wrong method !?!
  async updateInTabset(
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.log(`handleOpenedTab ${browserTab}, ${ts as Tabset}, ${additionalData}`)

    const api = RestApiDefinitions.getApi('RAPID_API_WEBSITE_CATEGORIZATION')
    if (api) {
      const tabset = await api.fetchTabset({ browserTab })
      // tabset.folders.push(...folders)
      //console.log('saving', tabset)
      await useTabsetsStore().saveTabset(tabset)
      return new ExecutionResult('done', 'done')
    }
    return Promise.reject('could not find API')
  }

  async addRapidApi($q: QVueGlobals, filename: string = ''): Promise<DialogChainObject> {
    const url = useTabsStore2().currentChromeTab?.url
    if (url) {
      const returned = await RapidApiAddUrlToTabsetHandler.queryBrowserTab()
      // console.log('returned', returned)
      if (returned.length > 0) {
      }

      return Promise.resolve(
        $q!.dialog({
          title: 'Adding Rapid API',
          message: 'This tab contains the definition of an Rapid API',
          options: {
            type: 'checkbox',
            model: [],
            items: [{ label: 'Add with folder', value: 'addFolder', color: 'secondary' }],
          },
          cancel: true,
          persistent: true,
        }),
      )
    } else {
      return Promise.reject('error')
    }
  }

  onOk = (data: any): ClickedHandler => {
    // console.log('hier!!', data)
    return this.clicked
  }

  private static async queryBrowserTab(): Promise<chrome.scripting.InjectionResult[]> {
    // console.log(`queryBrowserTab`)
    const chromeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    // console.log('chromeTab', chromeTab)
    if (chromeTab && chromeTab.length > 0) {
      return await chrome.scripting.executeScript({
        target: { tabId: chromeTab[0]!.id || 0 },
        func: () => {
          return {
            key: localStorage.getItem('tabsets.applicationAuthorizations.key'),
            apiName: localStorage.getItem('tabsets.apis.nodes.slugifiedName'),
            params: localStorage.getItem('tabsets.endpoint.params'),
            route: localStorage.getItem('tabsets.endpoint.route'),
            method: localStorage.getItem('tabsets.endpoint.method'),
            name: localStorage.getItem('tabsets.endpoint.name'),
            isGraphQL: localStorage.getItem('tabsets.endpoint.isGraphQL'),
            description: localStorage.getItem('tabsets.endpoint.description'),
            externalDocs: localStorage.getItem('tabsets.endpoint.externalDocs'),
          }
        },
        args: [],
      })
    } else {
      return Promise.reject('could not access tab')
    }
  }
}
