<template>
  <!-- SidePanelFoldersView -->
  <div class="q-ma-none q-pa-sm q-pl-md greyBorderBottom" v-if="props.tabset?.folders.length > 0">
    <q-breadcrumbs>
      <q-breadcrumbs-el class="cursor-pointer" @click="selectFolder(props.tabset)" icon="home" label="Home"/>
      <q-breadcrumbs-el class="cursor-pointer" @click="selectFolder(props.tabset, f)" v-for="f in currentFolderPath()" :label="f.name"
      />
    </q-breadcrumbs>
  </div>
  <q-list>
    <q-item v-if="props.tabset"
            v-for="folder in calcFolders(props.tabset)"
            clickable
            v-ripple
            class="q-ma-none q-pa-sm"
            @dragstart="startDrag($event, folder)"
            @dragenter="enterDrag($event, folder)"
            @dragover="overDrag($event, folder)"
            @dragend="endDrag($event, folder)"
            @drop="drop($event, folder)"
            :key="'panelfolderlist_' + folder.id">

      <q-item-section @click="selectFolder(tabset, folder as Tabset)"
                      class="q-mx-sm" style="justify-content:start;width:25px;max-width:25px">
        <div class="q-pa-none q-pl-none">
          <q-icon :name="folder.type === TabsetType.RSS_FOLDER ? 'o_rss_feed':'o_folder'" color="warning" size="sm"/>
        </div>
      </q-item-section>
      <q-item-section @click="selectFolder(tabset, folder as Tabset)">
        <q-item-label>
          <div class="text-subtitle2 ellipsis">
            {{ folder.name.substring(0, 20) }}
          </div>
        </q-item-label>
        <q-item-label class="text-caption text-grey-5">
          {{ folderCaption(folder) }}
        </q-item-label>
      </q-item-section>

      <q-item-section side
                      @mouseover="hoveredTabset = tabset?.id"
                      @mouseleave="hoveredTabset = undefined">
        <q-item-label>

                    <SpecialUrlAddToTabsetComponent
                      v-if="currentChromeTab"
                      @button-clicked="(args:ActionHandlerButtonClickedHolder) => handleButtonClicked(tabset, args, folder)"
                      :currentChromeTab="currentChromeTab"
                      :tabset="tabset"
                      :folder="folder"
                    />

          <q-icon class="cursor-pointer" name="more_vert" size="16px"/>
          <SidePanelSubfolderContextMenu :tabset="tabset" :folder="folder"/>
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>


</template>

<script lang="ts" setup>

import {PropType, ref, watchEffect} from "vue";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import '@he-tree/vue/style/default.css'
import '@he-tree/vue/style/material-design.css'
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import SidePanelSubfolderContextMenu from "src/tabsets/widgets/SidePanelSubfolderContextMenu.vue";
import {ActionHandlerButtonClickedHolder} from "src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder";
import {useUiStore} from "src/ui/stores/uiStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {useActionHandlers} from "src/tabsets/actionHandling/ActionHandlers";
import SpecialUrlAddToTabsetComponent from "src/tabsets/actionHandling/SpecialUrlAddToTabsetComponent.vue";

const props = defineProps({
  tabset: {type: Object as PropType<Tabset>, required: true}
})

const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const hoveredTabset = ref<string | undefined>(undefined)

watchEffect(() => {
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

const calcFolders = (tabset: Tabset): Tabset[] => {
  if (tabset.folderActive) {
    const af = useTabsetService().findFolder(tabset.folders, tabset.folderActive)
    if (af && af.folderParent) {
      return af.folders
    }
  }
  return tabset.folders
}

const startDrag = (evt: any, folder: Tabset) => {
  console.log("start dragging", evt, folder)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    //evt.dataTransfer.setData('text/plain', tab.id)
    //useUiStore().draggingTab(tab.id, evt)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}
const enterDrag = (evt: any, folder: Tabset) => {
  console.log("enter drag", evt, folder)
}
const overDrag = (event: any, folder: Tabset) => {
  console.log("enter drag", event, folder)
  event.preventDefault();
}
const endDrag = (evt: any, folder: Tabset) => {
  console.log("end drag", evt, folder)
}
const drop = (evt: any, folder: Tabset) => {
  console.log("drop", evt, folder)
  const tabToDrag = useUiStore().tabBeingDragged
  const tabset = useTabsetsStore().getCurrentTabset as Tabset | undefined
  if (tabToDrag && tabset) {
    console.log("tabToDrag", tabToDrag)
    const moveToFolderId = folder.id
    console.log("moveToFolderId", moveToFolderId)
    useTabsetService().moveTabToFolder(tabset, tabToDrag, moveToFolderId)
  }
}

const selectFolder = (tabset: Tabset, folder?: Tabset) => {
  console.log("selecting folder", tabset.id, folder?.id)
  tabset.folderActive = folder
    ? tabset.id === folder.id
      ? undefined
      : folder.id
    : undefined

  useTabsetService().saveTabset(tabset)
}

const folderCaption = (folder: Tabset): string =>
  (folder.name !== "..")
    ? folder.tabs.length + " tab" + (folder.tabs.length !== 1 ? 's' : '')
    : ""

const handleButtonClicked = async (tabset: Tabset, args: ActionHandlerButtonClickedHolder, folder?: Tabset) => {
  console.log(`button clicked: tsId=${tabset.id}, folderId=${folder?.id}, args=...`)
  await useActionHandlers(undefined).handleClick(tabset, currentChromeTab.value!, args, folder)
}

const parentChain = (tabset: Tabset, folder?: Tabset, chain: Tabset[] = [], depth:number = 0):object[] => {
  if (depth > 10) { // safety net
    return chain
  }
  if (!tabset.folderActive || tabset.id === folder?.folderParent) {
    return chain
  }
  if (!folder) {
    const f:Tabset | undefined = useTabsetsStore().getActiveFolder(tabset, tabset.folderActive)
    if (f) {
      chain.push(f)
      return parentChain(tabset, f, chain, depth++)
    }
  } else {
    const f:Tabset | undefined = useTabsetsStore().getActiveFolder(tabset, folder.folderParent)
    if (f) {
      chain.push(f)
      return parentChain(tabset, f, chain, depth++)
    }
  }
}

const currentFolderPath = (): object[] => {
  const res = parentChain(props.tabset)
  console.log("res", res)
  return res
}

</script>
