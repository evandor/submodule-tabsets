<template>
  <div class="row q-py-xs darkColors lightColors" v-if="messages.length > 0">
    <div class="col-10">
      <q-icon name="o_email" class="q-pr-sm q-mb-xs" />
      Messages
    </div>
    <div class="col-2 text-right">
      <!--      <q-icon v-if="showDetails" name="o_delete" color="negative" class="cursor-pointer" @click="clearMessages()" />-->

      <q-icon
        class="cursor-pointer"
        :name="showDetails ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        @click="toggleShowDetails()" />
    </div>
    <div class="column fit" v-if="showDetails">
      <div class="col text-body2 ellipsis" v-for="m in messages">
        <div class="row">
          <div class="col-8 ellipsis" :class="m.actionPath ? 'cursor-pointer' : ''">
            {{ m['message' as keyof object] }}
            <q-tooltip class="tooltip-small">{{ m.id }}</q-tooltip>
          </div>
          <div class="col-4 text-right ellipsis" style="font-size: smaller">
            {{ formatDate(m.created) }}
            <q-icon name="o_delete" class="cursor-pointer"></q-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatDistance } from 'date-fns'
import { Message } from 'src/tabsets/models/Message'
import { ref } from 'vue'

const messages = ref<Message[]>([])
const showDetails = ref(true)
const messageCount = ref(0)

const toggleShowDetails = () => (showDetails.value = !showDetails.value)

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
