<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Tab Comment</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Add a comment for this tab</div>
      </q-card-section>

      <q-card-section class="q-pt-none">

        <div class="q-pa-md q-gutter-sm">
          <!--          <q-editor v-model="editor" min-height="5rem" />-->

          <q-input
            v-model="editor"
            filled
            type="textarea"/>
        </div>

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat
               :label="props.sharedId ? 'Publish Comment' : 'Save Comment'"
               v-close-popup
               @click="publishComment()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useDialogPluginComponent} from "quasar";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddCommentCommand} from "src/domain/tabs/AddCommentCommand";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tabId: {type: String, required: true},
  sharedId: {type: String, required: false}
})

const editor = ref('')

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value);
})

const publishComment = () => useCommandExecutor().executeFromUi(new AddCommentCommand(props.tabId, editor.value))



</script>
