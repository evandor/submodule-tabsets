import {collection, deleteDoc, doc, Firestore, getDocs, setDoc} from "firebase/firestore";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {Tabset, TabsetSharing} from "src/tabsets/models/Tabset";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {LocalStorage, uid} from "quasar";
import {APP_INSTALLATION_ID} from "boot/constants";
import {useAuthStore} from "stores/authStore";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import {useUiStore} from "src/ui/stores/uiStore";
import {useThumbnailsService} from "src/thumbnails/services/ThumbnailsService";
import {useNotesStore} from "src/notes/stores/NotesStore";
import {sha256} from "js-sha256"

const STORE_IDENT = 'tabsets';

const installationId = LocalStorage.getItem(APP_INSTALLATION_ID) as string || '---'

function tabsetDoc(tabsetId: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, STORE_IDENT, tabsetId)
}

function tabsetsCollection() {
  return collection(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, STORE_IDENT)
}

class FirestoreTabsetsPersistence implements TabsetsPersistence {

  getServiceName(): string {
    return "FirestoreTabsetsPersistence"
  }

  async init() {
    console.debug(` ...initialized Tabsets: ${this.getServiceName()}`, '✅')
    //this.indexedDB = useDB(undefined).db as typeof IndexedDbPersistenceService
    return Promise.resolve("")
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  async loadTabsets(): Promise<any> {
    console.log(" ...loading tabsets", this.getServiceName());
    // useUiStore().syncing = true
    const docs = await getDocs(tabsetsCollection())
    docs.forEach((doc: any) => {
      let newItem = doc.data() as Tabset
      newItem.id = doc.id;
      useTabsetsStore().setTabset(newItem)
    })
    console.log("loading tabsets, found ", useTabsetsStore().tabsets.size);
    // useUiStore().syncing = false
    return Promise.resolve(undefined);
  }

  async addTabset(tabset: Tabset): Promise<any> {
    // useUiStore().syncing = true
    // tabset.origin = this.installationId
    console.log(`saving tabset ${tabset.id} in installation {this.installationId}`)
    await setDoc(tabsetDoc(tabset.id), JSON.parse(JSON.stringify(tabset)))
    // useUiStore().syncing = false
  }

  migrate(): any {
    // no op for firestore
  }

  async saveTabset(tabset: Tabset): Promise<any> {
    //useUiStore().syncing = true
    tabset.origin = installationId
    console.log(`saving tabset ${tabset.id} in installation ${installationId}`)
    await setDoc(tabsetDoc(tabset.id), JSON.parse(JSON.stringify(tabset)))
    //useUiStore().syncing = false
  }

  async deleteTabset(tabsetId: string): Promise<any> {
    //useUiStore().syncing = true
    await deleteDoc(tabsetDoc(tabsetId))
    //useUiStore().syncing = false
  }

  clear(name: string): void {
  }

  async share(ts: Tabset, sharing: TabsetSharing, sharedId: string | undefined, sharedBy: string | undefined): Promise<TabsetSharing | void> {
    console.log(`setting property 'sharing' to ${sharing} for tabset  ${ts.id} with sharedId ${sharedId}`)
    // const ts = getTabset(tabsetId) ?? throwIdNotFound("tabset", tabsetId)

    const firestore: Firestore = FirebaseServices.getFirestore()

    ts.sharing = sharing
    ts.sharedBy = sharedBy
    ts.view = "list"

    if (sharing === TabsetSharing.UNSHARED) {
      console.log("deleting share for tabset", ts.sharedId)
      if (sharedId) {
        await deleteDoc(doc(firestore, "public-tabsets", sharedId))
        ts.sharedBy = undefined
        ts.sharedById = undefined
        ts.sharedId = undefined
        await this.saveTabset(ts)
      }
      return
    }

    console.log("setting author and avatar for comments")
    for (const tab of ts.tabs) {
      for (const c of tab.comments) {
        console.log("found comment", c.author, c)
        if (c.author === "<me>") {
          c.author = useUiStore().sharingAuthor || '---'
          c.avatar = useUiStore().sharingAvatar
        }
      }
    }

    console.log("setting thumbnails as images")
    for (const tab of ts.tabs) {
      const thumb = await useThumbnailsService().getThumbnailFor(tab.url)
      if (thumb) {
        if (thumb && thumb['thumbnail' as keyof object]) {
          tab.image = thumb['thumbnail' as keyof object]
        }
      }
    }

    try {
      if (sharedId) {
        ts.sharedAt = new Date().getTime()
        console.log("updating with ts", ts)
        await setDoc(doc(firestore, "public-tabsets", sharedId), JSON.parse(JSON.stringify(ts)))
        await this.saveTabset(ts)

        const notesForTabset = await useNotesStore().getNotesFor(ts.id)
        console.log("found notes for tabset", ts.id, notesForTabset)
        // for (const note of notesForTabset) {
        //   //await setDoc(doc(firestore, "public-notes", note.id), JSON.parse(JSON.stringify(note)))
        // }


        return
      } else {
        ts.sharedAt = new Date().getTime()

        const publicId = uid()
        console.log("setting shared id to ", publicId)

        ts.sharedId = publicId
        ts.sharedById = useAuthStore().user.uid
        await this.saveTabset(ts)

        // avoid id leakage
        ts.id = ts.sharedById!
        //ts.sharedById = sha256(ts.sharedById)
        await setDoc(doc(firestore, "public-tabsets", publicId), JSON.parse(JSON.stringify(ts)))

        const notesForTabset = await useNotesStore().getNotesFor(ts.id)
        console.log("found notes for tabset", ts.id, notesForTabset)
        for (const note of notesForTabset) {
          note.sharedById = sha256(ts.sharedById!)
          note.sharedId = publicId
          await setDoc(doc(firestore, "public-notes", note.id), JSON.parse(JSON.stringify(note)))
        }

        return
      }
    } catch (e) {
      console.error("Error adding document: ", e);
    }

  }

  reloadTabset(tabsetId: string): Promise<Tabset> {
    throw new Error("reload tabset not yet implemented")
  }


}

export default new FirestoreTabsetsPersistence()
