<template>
  <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_description" color="primary" label="Create Note">
    <!--    <q-tooltip class="tooltip-small" v-if="props.tabset.sharing?.sharedId !== undefined">-->
    <!--      Stop sharing first if you want to delete this tabset-->
    <!--    </q-tooltip>-->
  </ContextMenuItem>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import NavigationService from 'src/services/NavigationService'
import { Tabset } from 'src/tabsets/models/Tabset'

const props = defineProps<{ tabset: Tabset }>()

const clicked = () => {
  const url =
    chrome && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL('www/index.html') + '#/mainpanel/notes/?tsId=' + props.tabset.id + '&edit=true'
      : '#/mainpanel/notes/?tsId=' + props.tabset.id + '&edit=true'
  NavigationService.openOrCreateTab([url])
}
</script>
