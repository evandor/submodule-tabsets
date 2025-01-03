<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6">Display RSS Feed?</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">This file seems to contain an RSS Feed</div>
        </q-card-section>
        <q-card-section>
          <div>
            <q-checkbox v-model="displayFeed" label="Display Feed" />
          </div>
          <div>
            <q-input :disable="!displayFeed" class="q-ml-md" v-model="feedName" label="Feed Name" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <DialogButton label="Cancel" color="accent" v-close-popup />
          <DialogButton
            label="Display"
            :disable="displayFeed && feedName.trim().length === 0"
            type="submit"
            :autofocus="true"
            @keyup.enter="display()"
            @wasClicked="display()"
            v-close-popup />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { ref } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const displayFeed = ref(false)
const feedName = ref<string>('')

const display = () => {
  onDialogOK({ displayFeed: displayFeed.value, feedName: feedName.value })
}
</script>
