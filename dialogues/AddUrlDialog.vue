<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Add Url to current tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide the url to be added</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">Url:</div>
        <q-input dense v-model="url"
                 data-testid="add_url_input"
                 autofocus @keyup.enter="createNewUrl()"/>
        <!--        <div class="text-body2 text-warning">{{ newUrlDialogWarning() }}</div>-->
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancelClick" v-close-popup/>
        <q-btn flat label="Add URL"
               data-testid="add_url_submit"
               :disable="url.trim().length === 0" v-close-popup
               @click="createNewUrl()"  />
      </q-card-actions>
    </q-card>

  </q-dialog>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import TabsetService from "src/tabsets/services/TabsetService";
import {uid, useDialogPluginComponent} from "quasar";
import {Tab} from "src/tabsets/models/Tab";
import ChromeApi from "src/app/BrowserApi";
import {useUtils} from "src/core/services/Utils";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  providedUrl: {
    type: String,
    default: ''
  }
})

// useUiStore().setIgnoreKeypress(true)

const url = ref<string>(props.providedUrl)

const {normalize} = useUtils()

// @ts-ignore
const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value);
})


const createNewUrl = () => {
  let useUrl = normalize(url.value)
  console.log("normalizing url", url.value, useUrl)
  const chromeTab = ChromeApi.createChromeTabObject(useUrl, useUrl, null as unknown as string)
  const tab = new Tab(uid(), chromeTab)
  tab.created = new Date().getTime()
  tab.extension = tab.determineUrlExtension(chromeTab)
  TabsetService.saveToCurrentTabset(tab)
    .then((res) => useTabsetService().saveCurrentTabset())
  // useUiStore().setIgnoreKeypress(false)
  onDialogOK()
}

const onDialogCancelClick = () => {
  // useUiStore().setIgnoreKeypress(false)
}

</script>
