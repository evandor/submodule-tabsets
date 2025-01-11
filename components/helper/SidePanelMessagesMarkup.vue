<template>
  <div class="row q-py-xs darkColors lightColors" v-if="messages.length > 0">
    <div class="col-11 text-primary"><q-icon name="o_email" class="q-pr-sm q-mb-xs" />Messages</div>
    <div class="col-1 text-primary">
      <q-icon name="keyboard_arrow_down" />
    </div>
    <div class="column">
      <div class="col text-body2 ellipsis" v-for="m in messages">
        {{ m['message' as keyof object] }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import { Message } from 'src/tabsets/models/Message'
import { ref, watchEffect } from 'vue'

const messages = ref<Message[]>([])

watchEffect(async () => {
  messages.value = useMessagesStore().getUnreadMessages
})
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
