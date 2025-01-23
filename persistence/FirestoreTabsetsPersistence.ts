import { DocumentReference } from '@firebase/firestore'
import { APP_INSTALLATION_ID } from 'boot/constants'
import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { sha256 } from 'js-sha256'
import { LocalStorage, uid } from 'quasar'
import { useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNotesStore } from 'src/notes/stores/NotesStore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { useEmailTemplates } from 'src/tabsets/emails/EmailTemplates'
import { Tab } from 'src/tabsets/models/Tab'
import { AugmentedData, Tabset, TabsetSharing } from 'src/tabsets/models/Tabset'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'

const { handleError } = useNotificationHandler()

const STORE_IDENT = 'tabsets'

const installationId = (LocalStorage.getItem(APP_INSTALLATION_ID) as string) || '---'

function tabsetDoc(tabsetId: string) {
  return doc(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, STORE_IDENT, tabsetId)
}

function publicTabsetDoc(sharedId: string) {
  return doc(FirebaseServices.getFirestore(), 'public-tabsets', sharedId)
}

function tabsetsCollection() {
  return collection(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, STORE_IDENT)
}

class FirestoreTabsetsPersistence implements TabsetsPersistence {
  getServiceName(): string {
    return 'FirestoreTabsetsPersistence'
  }

  async init() {
    // console.debug(` ...initialized Tabsets: ${this.getServiceName()}`, '✅')
    //this.indexedDB = useDB(undefined).db as typeof IndexedDbPersistenceService
    return Promise.resolve('')
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  async loadTabsets(): Promise<any> {
    //console.log(' ...loading tabsets', this.getServiceName())
    const docs = await getDocs(tabsetsCollection())
    for (const doc of docs.docs) {
      let newItem = doc.data()
      newItem.id = doc.id

      if (newItem['reference']) {
        await this.loadFromReference(newItem as { reference: DocumentReference; readonly: boolean; sharedAt: number })
      } else {
        newItem.loaded = new Date().getTime()
        useTabsetsStore().setTabset(newItem as Tabset)
      }
    }
    console.log('loading tabsets, found ', useTabsetsStore().tabsets.size)
    // useUiStore().syncing = false
    return Promise.resolve(undefined)
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
    tabset.augmentedData = new AugmentedData()
    console.log(`saving tabset ${tabset.id} in installation ${installationId}, ref:${tabset.sharing?.shareReference}`)
    if (tabset.sharing?.shareReference) {
      tabset.lastChangeBy = useAuthStore().user.uid
      await setDoc(
        doc(FirebaseServices.getFirestore(), tabset.sharing?.shareReference),
        JSON.parse(JSON.stringify(tabset)),
      )
    } else {
      await setDoc(tabsetDoc(tabset.id), JSON.parse(JSON.stringify(tabset)))
    }
  }

  async deleteTabset(tabsetId: string): Promise<any> {
    //useUiStore().syncing = true
    await deleteDoc(tabsetDoc(tabsetId))
    //useUiStore().syncing = false
  }

  clear(name: string): void {}

  async share(
    ts: Tabset,
    sharingType: TabsetSharing,
    sharedId: string | undefined,
    sharedBy: string | undefined,
  ): Promise<TabsetSharing | void> {
    console.log(`setting property 'sharing' to ${sharingType} for tabset  ${ts.id} with sharedId ${sharedId}`, ts)
    // const ts = getTabset(tabsetId) ?? throwIdNotFound("tabset", tabsetId)

    const firestore: Firestore = FirebaseServices.getFirestore()

    ts.sharing!.sharing = sharingType
    ts.sharing!.sharedBy = sharedBy
    ts.view = 'list'

    if (sharingType === TabsetSharing.UNSHARED) {
      console.log('deleting share for tabset', ts.sharing?.sharedId)
      if (sharedId) {
        await deleteDoc(doc(firestore, 'public-tabsets', sharedId))
        ts.sharing!.sharedBy = undefined
        ts.sharing!.sharedById = undefined
        ts.sharing!.sharedId = undefined
        await this.saveTabset(ts)
      }
      return
    }

    console.log('setting author and avatar for comments')
    for (const tab of ts.tabs) {
      for (const c of tab.comments) {
        console.log('found comment', c.author, c)
        if (c.author === '<me>') {
          c.author = useUiStore().sharingAuthor || '---'
          c.authorEmail = useAuthStore().user.email || undefined
        }
      }
    }

    console.log('setting thumbnails as images')
    for (const tab of ts.tabs) {
      const thumb = await useThumbnailsService().getThumbnailFor(tab.id)
      if (thumb) {
        if (thumb && thumb['thumbnail' as keyof object]) {
          tab.image = thumb['thumbnail' as keyof object]!
        }
      }
    }

    try {
      if (sharedId) {
        ts.sharing.sharedAt = new Date().getTime()
        console.log('updating with ts', ts)
        await setDoc(doc(firestore, 'public-tabsets', sharedId), JSON.parse(JSON.stringify(ts)))
        await this.saveTabset(ts)

        const notesForTabset = await useNotesStore().getNotesFor(ts.id)
        console.log('found notes for tabset', ts.id, notesForTabset)
        // for (const note of notesForTabset) {
        //   //await setDoc(doc(firestore, "public-notes", note.id), JSON.parse(JSON.stringify(note)))
        // }

        return
      } else {
        ts.sharing.sharedAt = new Date().getTime()

        const publicId = uid()
        console.log('setting shared id to ', publicId)

        ts.sharing!.sharedId = publicId
        ts.sharing!.sharedById = useAuthStore().user.uid
        await this.saveTabset(ts)

        // avoid id leakage
        ts.id = 'publicly-shared-tabset'
        //ts.sharing?.sharedById = sha256(ts.sharing?.sharedById)
        await setDoc(doc(firestore, 'public-tabsets', publicId), JSON.parse(JSON.stringify(ts)))

        const notesForTabset = await useNotesStore().getNotesFor(ts.id)
        console.log('found notes for tabset', ts.id, notesForTabset)
        for (const note of notesForTabset) {
          note.sharedById = sha256(ts.sharing!.sharedById!)
          note.sharedId = publicId
          await setDoc(doc(firestore, 'public-notes', note.id), JSON.parse(JSON.stringify(note)))
        }

        return
      }
    } catch (e) {
      console.error('Error adding document: ', e)
    }
  }

  async shareWith(
    ts: Tabset,
    email: string,
    readonly: boolean,
    sharedBy: string | undefined,
  ): Promise<TabsetSharing | void> {
    // https://thedailywtf.com/articles/Validating_Email_Addresses and
    // https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression
    const emailRegex =
      /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z{|}~])*@[a-zA-Z](-?[a-zA-Z0-9])*(\.[a-zA-Z](-?[a-zA-Z0-9])*)+$/
    if (!emailRegex.test(email)) {
      // handleError()
      return Promise.reject('this email address does not seem valid')
    }

    const firestore: Firestore = FirebaseServices.getFirestore()
    const sharedTsRef = doc(firestore, 'users', useAuthStore().user.uid, 'tabset-shares', ts.id)
    // await updateDoc(sharedTsRef, JSON.parse(JSON.stringify(shared)))

    const key = btoa(email)
    const data: { [k: string]: any } = {}
    data[key] = {
      tabsetId: ts.id,
      tabsetName: ts.name,
      email: email,
      sharedBy: sharedBy,
      sharedById: useAuthStore().user.uid,
      status: 'pending',
      readonly: readonly,
      created: new Date().getTime(),
    }

    await setDoc(sharedTsRef, data, { merge: true })

    const tabsToShare: object[] = ts.tabs.map((t: Tab) => {
      return { url: t.url || '' }
    })

    const invitationEmail = useEmailTemplates().invitationSetup(email, ts.name, sharedBy || 'unknown', tabsToShare)
    //console.log('about to add', invitationEmail)
    await addDoc(collection(firestore, 'emails'), JSON.parse(JSON.stringify(invitationEmail)))
    ts.sharing!.sharing = TabsetSharing.USER
    ts.sharing!.sharedBy = useAuthStore().user.email || undefined
    await useTabsetsStore().saveTabset(ts)
  }

  async loadPublicTabset(sharedId: string): Promise<Tabset> {
    const res = await getDoc(publicTabsetDoc(sharedId))
    return res.data() as Tabset
  }

  async reloadTabset(tabsetId: string): Promise<Tabset> {
    console.debug('reloading tabset', tabsetId)
    const res = await getDoc(tabsetDoc(tabsetId))
    if (res.data() && res.data()!['reference']) {
      return this.loadFromReference(res.data() as { reference: DocumentReference; readonly: boolean; sharedAt: number })
    }
    return res.data() as Tabset
  }

  private async loadFromReference(r: { reference: DocumentReference; readonly: boolean; sharedAt: number }) {
    console.warn('found ref', r)
    //console.log('r', r.path)
    const refDoc = await getDoc(r.reference)
    const referencedTabset = refDoc.data() as Tabset
    referencedTabset.sharing!.shareReference = r.reference.path
    referencedTabset.loaded = new Date().getTime()
    if (!referencedTabset.augmentedData) {
      referencedTabset.augmentedData = new AugmentedData()
    }
    referencedTabset.augmentedData.sharedAt = r.sharedAt || 0
    referencedTabset.augmentedData.readonly = r.readonly
    console.log('referencedTabset:', referencedTabset.sharing?.shareReference)
    useTabsetsStore().setTabset(referencedTabset)
    return referencedTabset
  }
}

export default new FirestoreTabsetsPersistence()
