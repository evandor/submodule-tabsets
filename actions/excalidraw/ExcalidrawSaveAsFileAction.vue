<template>
  <ContextMenuItem
    v-close-popup
    @was-clicked="clicked()"
    icon="o_tab"
    color="primary"
    :disable="props.tabset.sharing?.sharedId !== undefined"
    label="Save as new file">
  </ContextMenuItem>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ComponentContext } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { ExcalidrawAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/ExcalidrawAddUrlToTabsetHandler'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref } from 'vue'

const $q = useQuasar()
const props = defineProps<{ tabset: Tabset; context?: ComponentContext }>()

const filename = ref('')

const clicked = () => {
  $q!
    .dialog({
      title: 'Save as Excalidraw File',
      message: 'Please Provide a name (min 3 characters)',
      prompt: { model: filename.value, isValid: (val: string) => val.length > 2, type: 'text' },
      cancel: true,
      persistent: true,
    })
    .onOk((filename: string) => {
      const ts = useTabsetsStore().getCurrentTabset
      const chromeTab = useTabsStore2().currentChromeTab
      if (ts && chromeTab) {
        const folder = useTabsetsStore().getActiveFolder(ts)
        console.log('saving new excalidraw file', filename, ts, chromeTab)
        new ExcalidrawAddUrlToTabsetHandler($q).clicked(chromeTab, ts, folder, { dialog: { filename } })
      }
    })
}
</script>
