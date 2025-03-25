<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Report a Bug</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          Please describe the issue you have and we'll try to fix the problem with the next release.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">Name:</div>
        <div>
          <q-input v-model="name" outlined dense />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">Email:</div>
        <div>
          <q-input v-model="email" outlined dense />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">Description:</div>
        <div>
          <q-input v-model="description" type="textarea" outlined dense />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <DialogButton label="Cancel" />
        <DialogButton
          label="Send Bug Report"
          @was-clicked="sendBugReport()"
          data-testid="add_url_submit"
          :default-action="true" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { ref } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const name = ref('')
const email = ref('')
const description = ref('')

const sendBugReport = () => {
  onDialogOK({
    name: name.value,
    email: email.value,
    message: description.value,
  })
}
</script>
