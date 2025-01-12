<template>
  <div class="row q-py-xs darkColors lightColors" v-if="tabset?.shareReference">
    <div class="col-11 darkColors lightColors">Shared Tabset</div>
    <div class="col-1 text-primary">
      <q-icon name="keyboard_arrow_down" />
    </div>
  </div>
  <div class="row q-py-xs darkColors lightColors" v-else-if="shared.length > 0">
    <div class="col-11 text-primary">
      <q-icon name="ios_share" size="xs" class="q-pr-xs q-mb-xs" />
      This collection is being shared
    </div>
    <div class="col-1 text-primary">
      <q-icon
        class="cursor-pointer"
        :name="showDetails ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        @click="toggleShowDetails()" />
    </div>
    <div v-if="showDetails" class="col-12 text-body2 ellipsis">Collection shared with {{ sharedWith }}:</div>
    <template v-if="showDetails" v-for="share in shared">
      <div class="col-11 q-pl-sm text-body2 ellipse">
        {{ share['email' as keyof object] }} ({{ share['status' as keyof object] }})
      </div>
      <div class="col-1 text-body2">
        <q-icon
          name="o_delete"
          color="negative"
          class="cursor-pointer"
          @click="removeShare(share['email' as keyof object])">
          <q-tooltip class="tooltip-small">Remove the invitation</q-tooltip>
        </q-icon>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { doc, DocumentSnapshot, getDoc, setDoc } from 'firebase/firestore'
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useAuthStore } from 'stores/authStore'
import { ref, watchEffect } from 'vue'

const tabset = ref<Tabset | undefined>(undefined)
const sharedWith = ref<string>('')
const showDetails = ref(true)
const shared = ref<object[]>([])

const updateSharedInfo = async () => {
  const currentTabsetId = useTabsetsStore().currentTabsetId
  if (currentTabsetId) {
    console.log('updating shared info')
    const sharedInfo: DocumentSnapshot = await getDoc(
      doc(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, 'tabset-shares', currentTabsetId),
    )
    if (sharedInfo.data()) {
      const data = sharedInfo.data() as object
      console.log('data', data)
      shared.value = Object.values(data)
        .filter((val: object) => val['status' as keyof object] !== 'deleted')
        .map((val: object) => {
          //const val = data[key as keyof object]
          return {
            email: val['email' as keyof object],
            status: val['status' as keyof object],
          }
        })

      // shared.value = sharedInfo.data()
      if (data) {
        let info = Object.keys(data).length + ' user(s)'
        sharedWith.value = info
      } else {
        sharedWith.value = '???'
      }
    }
  }
}

watchEffect(async () => {
  await updateSharedInfo()
})

watchEffect(() => {
  const msgs = useMessagesStore().getUnreadMessages
  console.log('got msgs', msgs)
  // changing messages means potential updates of shared info
  updateSharedInfo()
})

const removeShare = async (email: string) => {
  const currentTabsetId = useTabsetsStore().currentTabsetId
  if (currentTabsetId) {
    console.log('removing share', email, currentTabsetId)
    const docRef = doc(
      FirebaseServices.getFirestore(),
      'users',
      useAuthStore().user.uid,
      'tabset-shares',
      currentTabsetId,
    )
    const sharedDoc = await getDoc(docRef)
    const data = sharedDoc.data() as object
    console.log('got data', data)
    //delete data[btoa(email) as keyof object]
    const dataForEmail: { [k: string]: any } | undefined = data[btoa(email) as keyof object] as
      | { [k: string]: any }
      | undefined
    if (dataForEmail) {
      dataForEmail['status' as keyof object] = 'deleted'
      dataForEmail['changed' as keyof object] = new Date().getTime()
      dataForEmail['sharedWithId'] = ''
    }
    await setDoc(docRef, data)
  }
  updateSharedInfo()
}

const toggleShowDetails = () => (showDetails.value = !showDetails.value)
</script>

<style scoped lang="scss">
.body--dark .darkColors {
  background-color: $grey-9;
  border: 1px solid $grey-8;
}

.body--light .lightColors {
  background-color: $grey-2;
  border: 1px solid $grey-3;
}
</style>
