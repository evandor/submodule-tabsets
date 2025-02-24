<template>
  <template v-if="props.level === 'root'">
    <q-separator inset />
    <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_tab" color="warning" label="New Subfolder" />
  </template>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import NewSubfolderDialog from 'src/tabsets/dialogues/NewSubfolderDialog.vue'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const clicked = () => {
  $q.dialog({
    component: NewSubfolderDialog,
    componentProps: {
      tabsetId: props.tabset.id,
      parentFolder: undefined,
    },
  })
}
</script>
