<template>
  <ContextMenuItem
    v-close-popup
    @was-clicked="clicked()"
    icon="o_tab"
    color="primary"
    :disable="disableMenuEntry()"
    label="Import Bookmarks">
  </ContextMenuItem>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ComponentContext } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref } from 'vue'

const $q = useQuasar()
const props = defineProps<{ tabset: Tabset; context?: ComponentContext }>()

const filename = ref('')

function getBmFolderId(chromeTab: chrome.tabs.Tab) {
  return chromeTab.url?.split('?')[1]?.split('=')[1] || undefined
}

const disableMenuEntry = () => {
  console.log('hier', props.context)
  if (props.context && props.context.chromeTab) {
    const folderId = getBmFolderId(props.context.chromeTab)
    console.log('got fodlerId', folderId)
    return !folderId ? true : (useTabsetsStore().getCurrentTabset?.bookmarkId || '') === folderId
  }
  return true
}

const clicked = () => {
  $q.dialog({
    title: 'Import Bookmarks',
    message: 'Click "OK" to import the  selected bookmarks folder to the current tabset',
    options: {
      type: 'checkbox',
      model: [],
      items: [{ label: 'Recursive', value: 'recursive', color: 'secondary' }],
    },
    cancel: true,
    persistent: true,
  }).onOk((filename: string) => {
    const ts = useTabsetsStore().getCurrentTabset
    const chromeTab = useTabsStore2().currentChromeTab
    if (ts && chromeTab) {
      const folder = useTabsetsStore().getActiveFolder(ts)
      console.log('ipmorting', filename, ts, chromeTab)
      // new ImportFromChromeBookmarksManagerAddUrlToTabsetHandler($q).clicked(chromeTab, ts, folder, { data: { filename } })
    }
  })
}
</script>
