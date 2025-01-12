<template>
  <div class="row q-py-xs darkColors lightColors" v-if="messages.length > 0">
    <div class="col-10 text-primary">
      <q-icon name="o_email" class="q-pr-sm q-mb-xs" />
      Messages
      <q-badge color="orange">{{ messageCount }}</q-badge>
      <span v-if="messageCount > 1" class="cursor-pointer text-body2 q-ml-md" @click="clearMessages()"
        >[delete {{ messageCount > messages.length ? 'all shown' : 'all' }}]</span
      >
    </div>
    <div class="col-2 text-primary text-right">
      <!--      <q-icon v-if="showDetails" name="o_delete" color="negative" class="cursor-pointer" @click="clearMessages()" />-->

      <q-icon
        class="cursor-pointer"
        :name="showDetails ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        @click="toggleShowDetails()" />
    </div>
    <div class="column fit" v-if="showDetails">
      <div class="col text-body2 ellipsis" v-for="m in messages">
        <div class="row">
          <div class="col-8 ellipsis">
            {{ m['message' as keyof object] }}
            <q-tooltip class="tooltip-small">{{ m.id }}</q-tooltip>
          </div>
          <div class="col-4 text-right ellipsis" style="font-size: smaller">
            {{ formatDate(m.created) }}
            <q-icon name="o_delete" class="cursor-pointer" @click="deleteMessage(m)"></q-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatDistance } from 'date-fns'
import { deleteDoc, doc } from 'firebase/firestore'
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { Message } from 'src/tabsets/models/Message'
import { useAuthStore } from 'stores/authStore'
import { ref, watchEffect } from 'vue'

const messages = ref<Message[]>([])
const showDetails = ref(true)
const messageCount = ref(0)

watchEffect(async () => {
  const msgs = useMessagesStore().getUnreadMessages
  messages.value = msgs.slice(0, 20)
  messageCount.value = msgs.length
})

const toggleShowDetails = () => (showDetails.value = !showDetails.value)

const clearMessages = async () => {
  for (const m of messages.value) {
    // console.log('deleting message', m)
    await deleteDoc(doc(FirebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/messages/${m.id}`))
  }
}

const deleteMessage = async (m: Message) => {
  await deleteDoc(doc(FirebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/messages/${m.id}`))
}

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''
</script>

<style scoped lang="scss">
.body--dark .darkColors {
  background-color: $grey-8;
  border: 1px solid $grey-7;
}

.body--light .lightColors {
  background-color: $grey-1;
  border: 1px solid $grey-2;
}
</style>
