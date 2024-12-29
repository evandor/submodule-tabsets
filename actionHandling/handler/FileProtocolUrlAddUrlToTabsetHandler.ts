import { DialogChainObject, QVueGlobals } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import {
  AddUrlToTabsetHandler,
  AddUrlToTabsetHandlerAdditionalData,
  ButtonActions,
} from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'

export class FileProtocolUrlAddUrlToTabsetHandler implements AddUrlToTabsetHandler {
  constructor(public $q: QVueGlobals | undefined) {}

  chromePattern = /addRow\("([^"]*)","([^"]*)",([^,]*),([^,]*),"([^"]*)",([^,]*),"([^"])*"\)/gm

  // disabled, see https://issues.chromium.org/issues/40240444
  urlMatcher(): RegExp {
    return /^fileXXX:\/\/.*\/$/
  }

  contentMatcher(content: string): boolean {
    return false
  }

  actions(): ActionContext[] {
    return [new ActionContext('Save Local Directory', ButtonActions.Save)]
  }

  async clicked(
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    folder: Tabset | undefined,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    console.log('saving...', browserTab.id, additionalData)
    try {
      const filename = additionalData ? additionalData.data!['filename' as keyof object] : undefined
      if (!filename) {
        throw new Error('filename is missing')
      }

      console.log('hier')
      if ('showOpenFilePicker' in self) {
        console.log('da')
        // @ts-expect-error TODO
        const fileHandle = await window.showOpenFilePicker()
        console.log(fileHandle)
      }

      // const newTab = new Tab(uid(), browserTab)

      //const returned = await this.queryBrowserTab(browserTab, newTab.id, filename!)
      return Promise.reject('error')
      // if (returned.length > 0) {
      //
      //   newTab.title = filename
      //
      //   const firstFrameReturned = returned.at(0)
      //   console.log("hier", firstFrameReturned)
      //   if (firstFrameReturned && firstFrameReturned.result) {
      //     newTab.storage = new ExcalidrawStorage(
      //       JSON.stringify(JSON.parse(firstFrameReturned.result['excalidraw' as keyof object])),
      //       firstFrameReturned.result['excalidrawState' as keyof object],
      //       firstFrameReturned.result['versionFiles' as keyof object],
      //       firstFrameReturned.result['versionDataState' as keyof object]
      //     )
      //   }
      //   return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive, true))
      // }
    } catch (error: any) {
      console.warn('error', error)
    }

    return Promise.reject('error updating excalidraw')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab): void {}

  async updateInTabset(
    browserTab: chrome.tabs.Tab,
    ts: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    console.log('saving...', browserTab.id, additionalData)
    try {
      // const filename = additionalData ? additionalData['filename' as keyof object] : undefined
      // if (!filename) {
      //   throw new Error("filename is missing")
      // }

      console.log('hier')
      if ('showOpenFilePicker' in self) {
        console.log('da')

        try {
          // const directoryHandleOrUndefined = await get('directory');
          // if (directoryHandleOrUndefined) {
          //   pre2.textContent = `Retrieved directroy handle "${directoryHandleOrUndefined.name}" from IndexedDB.`;
          //   return;
          // }
          // const [directoryHandle] = await window.showDirectoryPicker({ mode: "read" });
          // console.log(directoryHandle)
          // await set('directory', directoryHandle);
          // pre2.textContent = `Stored directory handle for "${directoryHandle.name}" in IndexedDB.`;
        } catch (error: any) {
          console.log('error', error)
        }
      }

      // const newTab = new Tab(uid(), browserTab)

      //const returned = await this.queryBrowserTab(browserTab, newTab.id, filename!)
      return Promise.reject('error')
    } catch (error: any) {
      console.warn('error', error)
    }

    return Promise.reject('error updating excalidraw')
  }

  withDialog(action: ButtonActions): DialogChainObject | undefined {
    //
    return undefined
  }
}
