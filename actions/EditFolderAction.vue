<template>
  <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_folder" color="warning" label="Edit Folder">
  </ContextMenuItem>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import RenameSubfolderDialog from 'src/tabsets/dialogues/RenameSubfolderDialog.vue'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const clicked = () => {
  $q.dialog({
    component: RenameSubfolderDialog,
    componentProps: {
      tabset: props.tabset,
      folder: props.folder!,
      name: props.folder!.name,
    },
  })
}
</script>
