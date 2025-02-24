<template>
  <!-- SidePanelFoldersView -->
  <div
    class="q-ma-none q-pa-sm q-pl-md greyBorderBottom"
    v-if="props.tabset?.folders?.length > 0 && currentFolderPath().length > 0">
    <q-breadcrumbs>
      <q-breadcrumbs-el
        class="cursor-pointer"
        icon="home"
        @click="selectFolder(props.tabset)"
        @dragover="overDrag2($event)"
        @drop="dropAtBreadcrumb($event)" />
      <q-breadcrumbs-el
        v-for="f in currentFolderPath()"
        class="cursor-pointer"
        @dragover="overDrag2($event)"
        @drop="dropAtBreadcrumb($event, f)"
        @click="selectFolder(props.tabset, f)"
        :label="f['name' as keyof object]" />
    </q-breadcrumbs>
  </div>

  <q-list>
    <q-item
      v-if="props.tabset"
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
      <q-item-section
        @click="selectFolder(tabset, folder as Tabset)"
        class="q-mx-sm"
        style="justify-content: start; width: 25px; max-width: 25px">
        <div class="q-pa-none q-pl-none">
          <q-icon :name="folder.type === TabsetType.RSS_FOLDER ? 'o_rss_feed' : 'o_folder'" color="warning" size="sm" />
        </div>
      </q-item-section>
      <q-item-section @click="selectFolder(tabset, folder as Tabset)">
        <q-item-label>
          <div class="text-subtitle2 ellipsis">
            {{ folder.name.substring(0, 20) }}
          </div>
        </q-item-label>
        <q-item-label class="text-caption text-secondary">
          {{ folderCaption(folder) }}
        </q-item-label>
      </q-item-section>

      <q-item-section side @mouseover="hoveredTabset = tabset?.id" @mouseleave="hoveredTabset = undefined">
        <q-item-label>
          <SpecialUrlAddToTabsetComponent
            v-if="currentChromeTab"
            @button-clicked="(args: ActionHandlerButtonClickedHolder) => handleButtonClicked(tabset, args, folder)"
            :currentChromeTab="currentChromeTab"
            :tabset="tabset"
            :level="'folder'"
            :folder="folder" />

          <!--          <q-icon class="cursor-pointer" name="more_vert" size="16px" />-->
          <!--          <SidePanelSubfolderContextMenu :tabset="tabset" :folder="folder" />-->
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { PropType, ref, watchEffect } from 'vue'
import '@he-tree/vue/style/default.css'
import '@he-tree/vue/style/material-design.css'
import { QVueGlobals } from 'quasar'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import SpecialUrlAddToTabsetComponent from 'src/tabsets/actionHandling/SpecialUrlAddToTabsetComponent.vue'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

const props = defineProps({
  tabset: { type: Object as PropType<Tabset>, required: true },
})

const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const hoveredTabset = ref<string | undefined>(undefined)

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
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
  console.log('start dragging', evt, folder)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    //evt.dataTransfer.setData('text/plain', tab.id)
    //useUiStore().draggingTab(tab.id, evt)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}
const enterDrag = (evt: any, folder: Tabset) => {
  //console.log("enter drag", evt, folder)
}
const overDrag = (event: any, folder: Tabset) => {
  //console.log("enter drag", event, folder)
  event.preventDefault()
}

const overDrag2 = (event: any) => {
  //console.log("enter drag2")
  event.preventDefault()
}

const endDrag = (evt: any, folder: Tabset) => {
  // console.log("end drag", evt, folder)
}
const drop = (evt: any, folder: Tabset) => {
  console.log('drop', evt, folder)
  const tabToDrag = useUiStore().tabBeingDragged
  const tabset = useTabsetsStore().getCurrentTabset as Tabset | undefined
  if (tabToDrag && tabset) {
    // console.log("tabToDrag", tabToDrag)
    const moveToFolderId = folder.id
    // console.log("moveToFolderId", moveToFolderId)
    useTabsetService().moveTabToFolder(tabset, tabToDrag, moveToFolderId)
  }
}

const dropAtBreadcrumb = (evt: any, f?: any) => {
  // console.log("dropAtBreadcrumb", evt, f)
  const tabToDrag = useUiStore().tabBeingDragged
  const tabset = useTabsetsStore().getCurrentTabset as Tabset | undefined
  // console.log("tabToDrag", tabToDrag, tabset?.id)
  if (tabToDrag && tabset) {
    const moveToFolderId = f?.id || undefined
    // console.log("moveToFolderId", moveToFolderId)
    useTabsetService().moveTabToFolder(tabset, tabToDrag, moveToFolderId)
  }
}

const selectFolder = (tabset: Tabset, folder?: Tabset) => {
  console.log(`selecting folder '${folder?.id}' (${folder?.name}) in tabset ${tabset.id} (${tabset.name})`)
  tabset.folderActive = folder ? (tabset.id === folder.id ? undefined : folder.id) : undefined

  useTabsetService().saveTabset(tabset)
  useTabsetService().handleHeadRequests(tabset, folder?.id)
}

const folderCaption = (folder: Tabset): string =>
  folder.name !== '..' ? folder.tabs.length + ' tab' + (folder.tabs.length !== 1 ? 's' : '') : ''

const handleButtonClicked = async (tabset: Tabset, args: ActionHandlerButtonClickedHolder, folder?: Tabset) => {
  console.log(`button clicked: tsId=${tabset.id}, folderId=${folder?.id}, args=...`)
  await useActionHandlers(null as unknown as QVueGlobals).handleClick(tabset, currentChromeTab.value!, args, folder)
}

const parentChain = (tabset: Tabset, folder?: Tabset, chain: Tabset[] = []): Tabset[] => {
  // console.log(`parentChain tabset: ${tabset.id} (active: ${tabset.folderActive}), folder:${folder?.id}, chain.length: ${chain.length}`)
  if (chain.length > 5) {
    // safety net
    return chain
  }
  // if (!tabset.folderActive || tabset.id === folder?.folderParent) {
  if (!tabset.folderActive || tabset.id === folder?.folderParent || tabset.id === tabset.folderActive) {
    //|| tabset.folderActive === folder?.id) {
    // console.log("returning chain...")
    return chain
  }
  if (!folder) {
    // console.log("!folder", tabset.folderActive)
    const f: Tabset | undefined = useTabsetsStore().getActiveFolder(tabset, tabset.folderActive)
    if (f) {
      chain.push(f)
      return parentChain(tabset, f, chain)
    }
  } else {
    const f: Tabset | undefined = useTabsetsStore().getActiveFolder(tabset, folder.folderParent)
    if (f) {
      chain.push(f)
      return parentChain(tabset, f, chain)
    }
  }
  return chain
}

const currentFolderPath = (): Tabset[] => {
  const res: Tabset[] = parentChain(props.tabset)
  return res ? res.reverse() : []
}
</script>
