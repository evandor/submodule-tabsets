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

      <q-card-section>
        <div class="text-body1">
          For now, please send us a mail to
          <span class="text-blue-8 cursor-pointer" @click="copyToClipboard('tabsets.extension@gmail.com')"
            >tabsets.extension@gmail.com</span
          >
          &nbsp;<q-icon class="cursor-pointer" name="o_copy" @click="copyToClipboard('tabsets.extension@gmail.com')" />
          .
        </div>
      </q-card-section>

      <q-card-section>
        <div class="text-body2">
          Please copy and paste the Console Log to your mail to help us finding the error cause.
        </div>
      </q-card-section>

      <!--      <q-card-section class="q-pt-none">-->
      <!--        <div class="text-body">Name:</div>-->
      <!--        <div>-->
      <!--          <q-input v-model="name" outlined dense />-->
      <!--        </div>-->
      <!--      </q-card-section>-->

      <!--      <q-card-section class="q-pt-none">-->
      <!--        <div class="text-body">Email:</div>-->
      <!--        <div>-->
      <!--          <q-input v-model="email" outlined dense />-->
      <!--        </div>-->
      <!--      </q-card-section>-->

      <q-card-section class="q-pt-none">
        <div class="text-body text-bold">
          Console Log To Analyse: &nbsp;<q-icon
            class="cursor-pointer"
            name="o_copy"
            @click="copyToClipboard(description)" />
        </div>
        <div>
          <q-input v-model="description" type="textarea" outlined dense />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <DialogButton label="Done" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { CopyToClipboardCommand } from 'src/core/domain/commands/CopyToClipboard'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'

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

watchEffect(() => {
  description.value =
    useUiStore().logs.join('\n') +
    '\nErrors: ' +
    useUiStore().errorCount +
    '\nWarnings: ' +
    useUiStore().warningCount +
    '\nVersion: ' +
    import.meta.env.PACKAGE_VERSION
})

const copyToClipboard = (txt: string) => {
  useCommandExecutor().executeFromUi(new CopyToClipboardCommand(txt))
}
// const openMailClient = () => {
//   const emailUrl = 'mailto:tabsets.extension@gmail.com'
//   chrome.tabs.create({ url: emailUrl }, function (tab: chrome.tabs.Tab) {
//     setTimeout(function () {
//       chrome.tabs.remove(tab.id!)
//     }, 2500)
//   })
// }
</script>
