<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-card class="q-dialog-plugin" style="max-width:100%">
        <q-card-section>
          <div class="text-h6">Start new Session...</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">You can save and hide your current tabs and start a new session.</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">Your current tabs can later be restored from 'Session {{oldSessionName}}'.</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">Clicking 'start' will close all open tabs in this window but not the pinned ones.</div>
        </q-card-section>
        <q-card-section>
          <div>
            <q-input
              class="q-ml-md" v-model="sessionName" label="Start new Collection" />
          </div>
        </q-card-section>
        <q-card-actions align="right">

          <DialogButton label="Cancel" color="accent" v-close-popup/>
          <DialogButton label="Start"
                        type="submit"
                        :disable="sessionName.length === 0"
                        :autofocus="true"
                        @keyup.enter="display()"
                        @wasClicked="display()"
                        v-close-popup/>

        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>

import {useDialogPluginComponent} from "quasar";
import DialogButton from "src/core/dialog/buttons/DialogButton.vue";
import {ref, watchEffect} from "vue";
import {STRIP_CHARS_IN_USER_INPUT} from "src/boot/constants";

defineEmits([
  ...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const oldSessionName = ref<string>(new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString())
const sessionName = ref<string>('')

watchEffect(() => {
  if (sessionName.value) {
    sessionName.value = sessionName.value.replace(STRIP_CHARS_IN_USER_INPUT,'')
    if (sessionName.value.length > 20) {
      sessionName.value = sessionName.value.substring(0,20)
    }
  }
})

const display = () => {
  onDialogOK({sessionName: sessionName.value, oldSessionName: oldSessionName.value})
}

</script>
