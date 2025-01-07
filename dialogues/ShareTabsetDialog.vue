<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div v-if="props.republish" class="text-h6">Republish Tabset</div>
        <div v-else class="text-h6">Share Tabset...</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          Would you like to {{ props.republish ? 're-share' : 'share' }} this tabset: {{ props.tabsetName }}?
        </div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Author:</div>
        <q-input
          v-model="author"
          class="q-mb-md q-pb-none"
          dense
          autofocus
          type="text"
          error-message="Please do not use special Characters, maximum length is 32" />
      </q-card-section>
      <q-card-section>
        <div class="text-body">User to share with:</div>
        <q-input
          v-model="shareWithEmail"
          class="q-mb-md q-pb-none"
          dense
          autofocus
          type="email"
          error-message="Please provide a valid email address" />
      </q-card-section>
      <q-card-section v-if="pendingInvitations.length > 0">
        <div class="text-body">Pending Invitations:</div>
        <div v-for="invitation in pendingInvitations">
          {{ invitation['email' as keyof object] }}
        </div>
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn size="md" color="accent" label="Cancel" @click="onDialogCancel" />
        <q-btn
          size="md"
          color="warning"
          :label="props.republish ? 'Republish Tabset' : 'Share Tabset'"
          v-close-popup
          :disable="!author"
          @click="shareTabset()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { collection, getDocs } from 'firebase/firestore'
import { LocalStorage, useDialogPluginComponent, useQuasar } from 'quasar'
import { SHARING_AUTHOR_IDENT } from 'src/boot/constants'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { ShareWithTabsetCommand } from 'src/tabsets/commands/ShareWithTabsetCommand'
import { TabsetSharing } from 'src/tabsets/models/Tabset'
import { useAuthStore } from 'stores/authStore'
import { onMounted, ref } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const $q = useQuasar()

const props = defineProps({
  tabsetId: { type: String, required: true },
  tabsetName: { type: String, required: true },
  sharedId: { type: String, required: false },
  republish: { type: Boolean, required: false },
})

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const author = ref<string>(LocalStorage.getItem(SHARING_AUTHOR_IDENT) || '')
const shareWithEmail = ref<string>('')
const pendingInvitations = ref<object[]>([])

onMounted(async () => {
  console.log('checking existing invitations and shares...')
  const docs = await getDocs(
    collection(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, 'shares', props.tabsetId, 'pending'),
  )
  pendingInvitations.value = []
  docs.forEach((doc: any) => {
    console.log('got doc', doc.data())
    pendingInvitations.value.push(doc.data())
  })
})

const shareTabset = () => {
  $q.localStorage.set(SHARING_AUTHOR_IDENT, author.value)
  useCommandExecutor()
    .executeFromUi(
      new ShareWithTabsetCommand(
        props.tabsetId,
        props.sharedId,
        TabsetSharing.USER,
        author.value,
        shareWithEmail.value,
        props.republish,
      ),
    )
    .then((res: any) => {
      //useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
    })
}
</script>
