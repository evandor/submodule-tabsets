<template>
  <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_tab" color="primary" label="Add Markdown Page">
    <!--    <q-tooltip class="tooltip-small" v-if="props.tabset.sharing?.sharedId !== undefined">-->
    <!--      Stop sharing first if you want to delete this tabset-->
    <!--    </q-tooltip>-->
  </ContextMenuItem>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { Tabset } from 'src/tabsets/models/Tabset'

const $q = useQuasar()
const props = defineProps<{ tabset: Tabset }>()

const clicked = () => {
  $q.dialog({
    title: 'Save Markdown File',
    message: "The file's content can be analysed and dynamically extracted.",
    options: {
      type: 'checkbox',
      model: [],
      items: [{ label: 'Use for links', value: 'useForLinks', color: 'secondary' }],
    },
    cancel: true,
    persistent: true,
  })
}
</script>
