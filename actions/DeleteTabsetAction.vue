<template>
  <ContextMenuItem
    v-close-popup
    @was-clicked="deleteTabsetDialog()"
    icon="o_delete"
    color="negative"
    :disable="props.tabset.sharing?.sharedId !== undefined"
    :label="props.tabset.type === TabsetType.SESSION ? 'Delete Session' : 'Delete Tabset'">
    <q-tooltip class="tooltip-small" v-if="props.tabset.sharing?.sharedId !== undefined">
      Stop sharing first if you want to delete this tabset
    </q-tooltip>
  </ContextMenuItem>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'

const props = defineProps<{ tabset: Tabset }>()

const deleteTabsetDialog = () => {}
</script>
