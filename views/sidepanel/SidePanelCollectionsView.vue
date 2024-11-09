<template>
  <div class="col-8 q-ml-md q-mt-sm">
    <div class="text-caption">Collection</div>
    <div class="text-body1 text-bold cursor-pointer" @click="router.push('/sidepanel/collections')">
      {{ currentTabset?.name }}
      <q-icon name="arrow_drop_down" class="q-ma-none q-pa-none" color="grey-5" size="xs"/>
    </div>
  </div>
  <div class="col text-right vertical-middle q-mt-md">

            <span>
              <SpecialUrlAddToTabsetComponent
                v-if="currentChromeTab && currentTabset"
                @button-clicked="(args:ActionHandlerButtonClickedHolder) => handleButtonClicked(currentTabset!, args)"
                :currentChromeTab="currentChromeTab"
                :tabset="currentTabset"/>
            </span>
    <q-icon name="more_vert" size="sm" color="secondary" class="cursor-pointer"/>
    <SidePanelPageContextMenu v-if="currentTabset" :tabset="currentTabset as Tabset"/>
  </div>
</template>
<script setup lang="ts">
import {ActionHandlerButtonClickedHolder} from "src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder";
import {Tabset} from "src/tabsets/models/Tabset";
import SidePanelPageContextMenu from "pages/sidepanel/SidePanelPageContextMenu.vue";
import SpecialUrlAddToTabsetComponent from "src/tabsets/actionHandling/SpecialUrlAddToTabsetComponent.vue";
</script>
