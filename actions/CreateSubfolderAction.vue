<template>
  <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_tab" color="primary" label="Create Subfolder">
    <!--    <q-tooltip class="tooltip-small" v-if="props.tabset.sharing?.sharedId !== undefined">-->
    <!--      Stop sharing first if you want to delete this tabset-->
    <!--    </q-tooltip>-->
  </ContextMenuItem>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import NewSubfolderDialog from 'src/tabsets/dialogues/NewSubfolderDialog.vue'
import { Tabset } from 'src/tabsets/models/Tabset'

const $q = useQuasar()
const props = defineProps<{ tabset: Tabset }>()

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
