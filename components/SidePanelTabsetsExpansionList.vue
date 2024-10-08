<template>
  <!-- SidePanelTabsetsExpansionList -->
  <q-list dense
          class="rounded-borders q-ma-none q-pa-none" :key="tabset.id"
          v-for="(tabset,index) in props.tabsets">
    <q-expansion-item v-if="showTabset(tabset as Tabset)"
                      header-class="q-ma-none q-pa-none q-pr-md"
                      :header-style="headerStyle(tabset as Tabset)"
                      group="tabsets"
                      :default-opened="useTabsetsStore().tabsets.size === 1"
                      switch-toggle-side
                      dense-toggle
                      v-model="selected_model[tabset.id]"
                      @update:model-value="val => updateSelectedTabset(tabset.id, val, index)">

      <template v-slot:header>
        <q-item-section
          class="q-mt-xs"
          :data-testid="'expansion_' + tabset.name"
          @mouseover="hoveredTabset = tabset.id"
          @mouseleave="hoveredTabset = undefined">
          <q-item-label :class="useTabsetsStore().getCurrentTabset?.id === tabset.id ? 'text-bold text-underline' : ''">
            <q-icon v-if="tabset.status === TabsetStatus.FAVORITE"
                    color="warning"
                    name="push_pin"
                    style="position: relative;top:-2px">
              <q-tooltip class="tooltip">This tabset is pinned for easier access</q-tooltip>
            </q-icon>
            {{ tabsetSectionName(tabset as Tabset) }}
            <span v-if="tabset.type === TabsetType.DYNAMIC">
                  <q-icon name="o_label" color="warning">
                    <q-tooltip class="tooltip">Dynamic Tabset, listing all tabsets containing this tag</q-tooltip>
                  </q-icon>
                </span>
          </q-item-label>
          <q-item-label class="text-caption text-grey-5">
            {{
              tabsetCaption(useTabsetService().tabsToShow(tabset as Tabset), tabset.window, tabset.folders?.length)
            }}
          </q-item-label>
          <q-item-label class="text-caption text-grey-5" v-if="tabsetExpanded.get(tabset.id)">
            <template v-for="n in notes">
              <div class="row">
                <div
                  class="col-2 cursor-pointer"
                  @click.stop="openNote(n)">
                  <q-icon name="description" class="q-ml-md" color="grey" size="12px"/>
                </div>
                <div
                  class="col vertical-bottom q-ml-xs ellipsis text-caption cursor-pointer text-blue-10"
                  @click.stop="openNote(n)">
                  {{ n.title }}
                </div>
              </div>
            </template>
          </q-item-label>
          <q-item-label v-if="tabset.sharedId" class="q-mb-xs"
                        @mouseover="hoveredPublicLink = true"
                        @mouseleave="hoveredPublicLink = false">
            <q-icon style="position: relative;top:-2px;left:-2px"
                    @click="shareTabsetPubliclyDialog(tabset as Tabset, tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0)"
                    name="ios_share"
                    class="q-ma-none q-pa-none q-mr-xs"
                    :class="tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0 ? 'cursor-pointer' : ''"
                    :color="tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0 ? 'warning' : 'primary'">
              <q-tooltip class="tooltip" v-if="tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0">
                This tabset is shared but has been changed in the meantime. You need to re-publish.
              </q-tooltip>
              <q-tooltip v-else class="tooltip">This tabset is shared</q-tooltip>
            </q-icon>
            <span class="text-caption cursor-pointer text-grey-7"
                  @click="openPublicShare(tabset.id)">open shared page</span>
            <q-icon
              v-show="hoveredPublicLink"
              class="q-ml-sm cursor-pointer"
              name="content_copy" color="primary" @click="copyPublicShareToClipboard(tabset.id)">
              <q-tooltip class="tooltip-small">Copy the Link to your Clipboard</q-tooltip>
            </q-icon>
            <!--                <q-icon-->
            <!--                  v-show="hoveredPublicLink"-->
            <!--                  class="q-ml-sm cursor-pointer"-->
            <!--                  name="open_in_browser" color="primary" @click="openElectronLink(tabset.id)">-->
            <!--                  <q-tooltip class="tooltip-small">Copy the Electron Link to your Clipboard</q-tooltip>-->
            <!--                </q-icon>-->
          </q-item-label>
        </q-item-section>

        <q-item-section side
                        @mouseover="hoveredTabset = tabset.id"
                        @mouseleave="hoveredTabset = undefined">
          <q-item-label>

            <!-- workaround for adding URLs in non-bex environments -->
            <q-btn outline
                   v-if="!inBexMode()"
                   @click.stop="$q.dialog({component: AddUrlDialog})"
                   class="q-ma-none q-px-sm q-py-none cursor-pointer"
                   name="o_bookmark_add"
                   color="warning"
                   size="xs">
              <div>Add URL</div>
            </q-btn>
            <!-- workaround for adding URLs in non-bex environments -->

            <template v-if="showAddTabButton(tabset as Tabset, currentChromeTab) && !tabset.dynamicUrl">
              <q-btn outline
                     @click.stop="saveInTabset(tabset.id, tabset.folderActive)"
                     class="q-ma-none q-px-sm q-py-none"
                     name="o_bookmark_add"
                     :class="alreadyInTabset() ? '':'cursor-pointer'"
                     :color="alreadyInTabset() ? 'grey-5': tsBadges.length > 0 ? 'positive':'warning'"
                     size="xs"
                     data-testid="saveInTabsetBtn">
                <div>Add Tab</div>
                <!--                  <q-icon right class="q-ma-none q-pa-none" size="2em" name="o_south" />-->
              </q-btn>
              <q-tooltip class="tooltip-small" v-if="alreadyInTabset()">
                Tab is already contained in tabset '{{ tabset.name }}'
              </q-tooltip>
              <q-tooltip class="tooltip-small" v-else-if="tsBadges.length > 0">
                {{ tooltipAlreadyInOtherTabsets(tabset.name) }}
              </q-tooltip>
              <q-tooltip class="tooltip-small" v-else>
                Add current Tab to '{{ tabsetNameOrChain(tabset as Tabset) }}'...
              </q-tooltip>
            </template>

            <template v-if="showAddTabButton(tabset as Tabset, currentChromeTab) && tabset.dynamicUrl">
              <q-btn outline

                     @click.stop="loadDynamicTabs(tabset)"
                     class="q-ma-none q-px-sm q-py-none cursor-pointer"
                     name="o_bookmark_add"
                     size="xs"
                     data-testid="loadDynamicTabset">
                Dynamic Load
                <!--                  <q-icon right class="q-ma-none q-pa-none" size="2em" name="o_south" />-->
              </q-btn>
              <q-tooltip class="tooltip-small">
                Load Dynamic Data
              </q-tooltip>
            </template>
            <!--            <span-->
            <!--              v-if="!alreadyInTabset() && showAddTabButton(tabset as Tabset, currentChromeTab) && tsBadges.length > 0"-->
            <!--              style="color: grey;font-size: 7px;position: relative;top:-2px;left:-11px;">{{-->
            <!--                tsBadges.length-->
            <!--              }}</span>-->

          </q-item-label>
        </q-item-section>

        <q-item-section side
                        @click.stop=""
                        @mouseover="hoveredTabset = tabset.id"
                        @mouseleave="hoveredTabset = undefined">
          <q-item-label v-if="useTabsetsStore().getCurrentTabset?.id === tabset.id">
            <q-icon class="cursor-pointer" name="more_vert" size="16px"/>
            <SidePanelPageContextMenu :tabset="tabset as Tabset"/>
          </q-item-label>
        </q-item-section>
      </template>

      <div class="q-ma-none q-pa-none">

        <template v-if="editHeaderDescription">
          <div class="row q-ma-none q-pa-md">
            <q-editor style="width:100%"
                      flat
                      v-model="headerDescription" min-height="5rem"
                      :definitions="{
                            save: {
                              tip: 'Save your work',
                              icon: 'save',
                              label: 'Save',
                              handler: saveTabsetDescription
                            },
                             pageNote: {
                              tip: 'Open page Note',
                              icon: 'open',
                              label: 'Open Page Note',
                              handler: openPageNote
                            }
                          }"
                      :toolbar="[
                            ['bold', 'italic', 'strike', 'underline'],
                            ['save','pageNote']
                          ]"
                      placeholder="Create a header description for your current tabset"/>
          </div>
        </template>
        <template v-else-if="tabset.headerDescription">
          <div class="row q-ma-sm q-pa-sm text-body2 darkInDarkMode brightInBrightMode"
               style="border:1px solid #efefef;border-radius:3px;" v-html="tabset.headerDescription"></div>
        </template>

        <q-list>
          <q-item v-for="folder in calcFolders(tabset as Tabset)"
                  clickable
                  v-ripple
                  class="q-ma-none q-pa-sm greyBorderBottom"
                  @dragstart="startDrag($event, folder)"
                  @dragenter="enterDrag($event, folder)"
                  @dragover="overDrag($event, folder)"
                  @dragend="endDrag($event, folder)"
                  @drop="drop($event, folder)"
                  :key="'panelfolderlist_' + folder.id">

            <q-item-section @click="selectFolder(tabset as Tabset, folder as Tabset)"
                            class="q-mr-sm text-right" style="justify-content:start;width:45px;max-width:45px">
              <div class="q-pa-none q-pl-md">
                <q-icon name="o_folder" color="warning" size="sm"/>
              </div>
            </q-item-section>
            <q-item-section @click="selectFolder(tabset as Tabset, folder as Tabset)">
              <q-item-label>
                <div class="text-bold">
                  {{ folder.name }}
                </div>
              </q-item-label>
              <q-item-label class="text-caption text-grey-5">
                {{ folderCaption(folder) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side
                            v-if="folder.name !== '..'"
                            @mouseover="hoveredTabset = tabset.id"
                            @mouseleave="hoveredTabset = undefined">
              <q-item-label>
                <q-icon class="cursor-pointer" name="more_vert" size="16px"/>
                <SidePanelSubfolderContextMenu :tabset="tabset as Tabset" :folder="folder"/>
              </q-item-label>
            </q-item-section>

          </q-item>
        </q-list>

        <!-- the actual tabs -->
        <SidePanelPageTabList
          v-if="tabsetExpanded.get(tabset.id)"
          :indent="calcFolders(tabset as Tabset)?.length > 0"
          :tabsCount="useTabsetService().tabsToShow(tabset as Tabset).length"
          :tabset="tabsetForTabList(tabset as Tabset)"
          :activeFolder="(tabset as Tabset).folderActive"
        />
        <!-- the actual tabs: end -->

      </div>
    </q-expansion-item>


  </q-list>
</template>

<script lang="ts" setup>

import {Tabset, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {onMounted, PropType, ref, watchEffect} from "vue";
import {useUiStore} from "src/ui/stores/uiStore";
import _ from "lodash";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {Tab} from "src/tabsets/models/Tab";
import ShareTabsetPubliclyDialog from "src/tabsets/dialogues/ShareTabsetPubliclyDialog.vue";
import {openURL, scroll, uid, useQuasar} from "quasar";
import {CopyToClipboardCommand} from "src/core/domain/commands/CopyToClipboard";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {useUtils} from "src/core/services/Utils";

import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useNotificationHandler} from "src/core/services/ErrorHandler";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import TabsetService from "src/tabsets/services/TabsetService";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {SelectTabsetCommand} from "src/tabsets/commands/SelectTabset";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import SidePanelSubfolderContextMenu from "src/tabsets/widgets/SidePanelSubfolderContextMenu.vue";
import SidePanelPageContextMenu from "pages/sidepanel/SidePanelPageContextMenu.vue";
import AddUrlDialog from "src/tabsets/dialogues/AddUrlDialog.vue";
import {useNotesStore} from "src/notes/stores/NotesStore";
import {Note} from "src/notes/models/Note";
import NavigationService from "src/services/NavigationService";
import SidePanelPageTabList from "src/tabsets/layouts/SidePanelPageTabList.vue";
import {LoadDynamicTabsCommand} from "src/tabsets/commands/LoadDynamicTabsCommand";
import getScrollTarget = scroll.getScrollTarget;

const props = defineProps({
  tabsets: {type: Array as PropType<Array<Tabset>>, required: true}
})

const emits = defineEmits(['re-render'])

const {setVerticalScrollPosition} = scroll
const {inBexMode, sanitize} = useUtils()
const {handleSuccess, handleError} = useNotificationHandler()

const $q = useQuasar()
const tabsetsStore = useTabsetsStore()


// https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
interface SelectionObject {
  [key: string]: boolean
}

const showAddCurrentTabTooltip = ref(false)
const currentTabsetId = ref<string | undefined>(undefined)
const tabsetExpanded = ref<Map<string, boolean>>(new Map())
const selected_model = ref<SelectionObject>({})
const hoveredTabset = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const editHeaderDescription = ref<boolean>(false)
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const hoveredPublicLink = ref(false)
const headerDescription = ref<string>('')
const notes = ref<Note[]>([])

onMounted(() => {
  if (useTabsetsStore().allTabsCount === 0) {
    setTimeout(() => {
      showAddCurrentTabTooltip.value = true
      setTimeout(() => showAddCurrentTabTooltip.value = false, 4500)
    }, 1500)
  }
})

const scrollToElement = (el: any, delay: number) => {
  if (!el) {
    return
  }
  setTimeout(() => {
    const target = getScrollTarget(el)
    const offset = el.offsetTop
    const duration = 200
    console.log("setting scroll position")
    setVerticalScrollPosition(target, offset - 120, duration)
    console.log("setting scroll position, done")
  }, delay);

}

watchEffect(async () => {
  // should trigger if currentTabsetId is changed from "the outside"
  currentTabsetId.value = useTabsetsStore().getCurrentTabset?.id || ''
  selected_model.value = {}
  selected_model.value[currentTabsetId.value] = true
  tabsetExpanded.value.set(currentTabsetId.value, true)
  const index = _.findIndex(props.tabsets as Tabset[], (ts: Tabset) => ts.id === currentTabsetId.value)
  scrollToElement(document.getElementsByClassName("q-expansion-item")[index], 300)
  useUiStore().tabsetsExpanded = true
  notes.value = await useNotesStore().getNotesFor(currentTabsetId.value)

})

// watchEffect(() => {
//   //console.log(" >>> change in getSelectedTab", useUiStore().getSelectedTab)
//   selectedTab.value = useUiStore().getSelectedTab
//   if (selectedTab.value) {
//     currentChromeTab.value = null as unknown as chrome.tabs.Tab
//   }
// })

watchEffect(() => {
  if (useTabsetsStore().tabsets) {
    //console.log(" >>> change in tabsets...")
    tabsetNameOptions.value = _.map([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
      return {
        label: ts.name,
        value: ts.id
      }
    })
    if (tabsetNameOptions.value.length > 0) {
      tabsetName.value = tabsetNameOptions.value[0]
    }
  }
})

// watchEffect(() => {
//   //console.log(" >>> change in getSelectedTab", useUiStore().getSelectedTab)
//   selectedTab.value = useUiStore().getSelectedTab
//   if (selectedTab.value) {
//     currentChromeTab.value = null as unknown as chrome.tabs.Tab
//   }
// })

watchEffect(() => {
  if (currentChromeTab.value?.url) {
    const url = currentChromeTab.value.url
    const tabsetIds = useTabsetService().tabsetsFor(url)
    tsBadges.value = []
    //created.value = undefined
    _.forEach(tabsetIds, (tsId: string) => {
      tsBadges.value.push({
        label: TabsetService.nameForTabsetId(tsId),
        tabsetId: tsId,
        encodedUrl: btoa(url || '')
      })
    })
  }

  watchEffect(() => {
    const windowId = useWindowsStore().currentChromeWindow?.id || 0
    currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
  })
})

const showTabset = (tabset: Tabset) => !useUiStore().tabsFilter ?
  true :
  (useUiStore().tabsFilter === '' || useTabsetService().tabsToShow(tabset).length > 0)


const headerStyle = (tabset: Tabset) => {
  const tabsetOpened: boolean = _.findIndex([...tabsetExpanded.value.keys()],
    (key: string) => (key !== null) && tabsetExpanded.value.get(key) !== undefined) >= 0
  let style = tabsetExpanded.value.get(tabset.id) ?
    'border:0 solid grey;border-top-left-radius:4px;border-top-right-radius:4px;' :
    tabsetOpened ?
      'border:0 solid grey;border-radius:4px;opacity:30%;' :
      'border:0 solid grey;border-radius:4px;'
  if (tabset.color && useFeaturesStore().hasFeature(FeatureIdent.COLOR_TAGS)) {
    style = style + 'border-left:4px solid ' + tabset.color
  } else {
    style = style + 'border-left:4px solid #f5f5f5'
  }
  return style
}

const updateSelectedTabset = (tabsetId: string, open: boolean, index: number | undefined = undefined) => {
  //console.log(`updating: selectedTabset=${tabsetId} ${open ? 'open':'closed'}`)
  tabsetExpanded.value.set(tabsetId, open)
  if (open) {
    if (index) {
      scrollToElement(document.getElementsByClassName("q-expansion-item")[index], 300)
    }

    useUiStore().tabsetsExpanded = true

    useCommandExecutor()
      .execute(new SelectTabsetCommand(tabsetId))
      .then(() => handleHeadRequests(useTabsetsStore().getTabset(tabsetId)!))

  } else {
    useUiStore().tabsetsExpanded = false
  }
}

const calcFolders = (tabset: Tabset): Tabset[] => {
  if (tabset.folderActive) {
    // const af = useTabsetService().findFolder(tabset.folders, tabset.folderActive)
    const af = useTabsetsStore().getActiveFolder(tabset, tabset.folderActive)
    if (af && af.folderParent) {
      return [new Tabset(af.folderParent, "..", [])].concat(af.folders)
    }
  }
  return tabset.folders
}

const openPageNote = () => {
  if (inBexMode()) {
    openURL(chrome.runtime.getURL("/www/index.html#/tabsets/" + useTabsetsStore().getCurrentTabset?.id || '' + "?tab=page"))
  }
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

const folderCaption = (folder: Tabset) =>
  (folder.name !== "..") ?
    folder.tabs.length + " tab" + (folder.tabs.length !== 1 ? 's' : '') :
    ""

const tabsetSectionName = (tabset: Tabset) => {
  if (!tabset.folderActive || tabset.id === tabset.folderActive) {
    return tabset.name
  }
  // const activeFolder = useTabsetService().findFolder([tabset], tabset.folderActive)
  const activeFolder = useTabsetsStore().getActiveFolder(tabset)
  return tabset.name + (activeFolder ? " - " + activeFolder.name : "?")
}

const tabsetCaption = (tabs: Tab[], window: string, foldersCount: number) => {
  const filter = useUiStore().tabsFilter
  let caption = ''
  if (!tabs) {
    caption = '-'
  }
  if (!filter || filter.trim() === '') {
    caption = tabs.length + ' tab' + (tabs.length === 1 ? '' : 's')
  } else {
    caption = tabs.length + ' tab' + (tabs.length === 1 ? '' : 's') + ' (filtered)'
  }
  if (foldersCount > 0) {
    caption = caption + ", " + foldersCount + " folder" + (foldersCount === 1 ? '' : 's')
  }
  if (window && window !== 'current') {
    caption = caption + " - opens in: " + window
  }
  if (notes.value.length > 0) {
    return caption + ", " + notes.value.length + " " + (notes.value.length === 1 ? 'note' : 'notes')
  }
  return caption
}


const shareTabsetPubliclyDialog = (tabset: Tabset, republish: boolean = false) => {
  $q.dialog({
    component: ShareTabsetPubliclyDialog,
    componentProps: {
      tabsetId: tabset.id,
      sharedId: tabset.sharedId,
      tabsetName: tabset.name,
      republish: republish
    }
  })
}

const tooltipAlreadyInOtherTabsets = (tabsetName: string) => {
  const tabsetList = _.join(_.map(tsBadges.value, (b: any) => b['label'] as keyof object), ", ")
  return "The current Tab is already contained in " +
    tsBadges.value.length + " other Tabsets: " + tabsetList + ". Click to add " +
    "it to '" + tabsetName + "' as well."
}

const openPublicShare = (tabsetId: string) => {
  const ts = useTabsetsStore().getTabset(tabsetId)
  if (ts && ts.sharedId) {
    openURL(getPublicTabsetLink(ts))
  }
}

const getPublicTabsetLink = (ts: Tabset) => {
  let image = "https://tabsets.web.app/favicon.ico"
  if (ts && ts.sharedId) {
    //return PUBLIC_SHARE_URL + "#/pwa/imp/" + ts.sharedId + "?n=" + btoa(ts.name) + "&a=" + btoa(ts.sharedBy || 'n/a') + "&d=" + ts.sharedAt
    //return "https://us-central1-tabsets-backend-prd.cloudfunctions.net/app/share/preview/" + ts.sharedId + "?n=" + btoa(ts.name) + "&a=" + btoa(ts.sharedBy || 'n/a')
    return process.env.BACKEND_URL + "/share/preview/" + ts.sharedId + "?n=" + btoa(ts.name) + "&a=" + btoa(ts.sharedBy || 'n/a')
  }
  return image
}

const copyPublicShareToClipboard = (tabsetId: string) => {
  const ts = useTabsetsStore().getTabset(tabsetId)
  if (ts && ts.sharedId) {
    const link = getPublicTabsetLink(ts)
    useCommandExecutor().executeFromUi(new CopyToClipboardCommand(link))
  }
}

const showAddTabButton = (tabset: Tabset, currentChromeTab: chrome.tabs.Tab | undefined) => {
  return inBexMode() &&
    tabset.type !== TabsetType.DYNAMIC &&
    currentChromeTab &&
    currentChromeTab.url &&
    currentChromeTab.url !== 'chrome://newtab/' &&
    currentChromeTab.url.indexOf('/www/index.html#/mainpanel/notes/') < 0 &&
    currentChromeTab.url !== '' &&
    currentChromeTab.url.indexOf('https://tabsets.web.app/?apiKey=') < 0 &&
    useTabsetsStore().getCurrentTabset?.id === tabset.id
}

const saveTabsetDescription = () => {
  console.log("saving tabset", headerDescription.value, useTabsetsStore().getCurrentTabset)
  const currentTs = useTabsetsStore().getCurrentTabset
  if (currentTs) {
    currentTs.headerDescription = sanitize(headerDescription.value)
    useTabsetService().saveCurrentTabset()
    editHeaderDescription.value = false
    headerDescription.value = ''
    handleSuccess(new ExecutionResult<string>('saved', 'saved'))
  } else {
    handleError("could not save description")
  }
}

const activeFolderNameFor = (ts: Tabset, activeFolder: string) => {
  // const folder = useTabsetService().findFolder(ts.folders, activeFolder)
  const folder = useTabsetsStore().getActiveFolder(ts, activeFolder)
  return folder ? folder.name : ts.name
}

const selectFolder = (tabset: Tabset, folder: Tabset) => {
  console.log("selecting folder", tabset.id, folder.id)
  tabset.folderActive = tabset.id === folder.id ? undefined : folder.id
  useTabsetService().saveTabset(tabset)
}

const tabsetNameOrChain = (tabset: Tabset) => {
  if (tabset.folderActive) {
    return activeFolderNameFor(tabset, tabset.folderActive)
  }
  return tabset.name
}

const alreadyInTabset = () => {
  if (currentChromeTab.value?.url && tabsetsStore.getCurrentTabset) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
}

const saveInTabset = (tabsetId: string, activeFolder: string | undefined) => {
  const useTS: Tabset | undefined = useTabsetsStore().getTabset(tabsetId)
  if (useTS && currentChromeTab.value) {
    // if (alreadyInTabset()) {
    //   return
    // }
    useCommandExecutor().execute(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab.value), useTS, activeFolder))
  } else {
    console.warn("expected to find tabsetId", tabsetId)
  }
}

const loadDynamicTabs = (tabset: Tabset) => {
  useCommandExecutor().execute(new LoadDynamicTabsCommand(tabset))
}

const tabsetForTabList = (tabset: Tabset) => {
  if (tabset.folderActive) {
    // const af = useTabsetService().findFolder(tabset.folders, tabset.folderActive)
    const af = useTabsetsStore().getActiveFolder(tabset)
    //console.log("result af", af)
    if (af) {
      return af
    }
  }
  return tabset
}

async function handleHeadRequests(selectedTabset: Tabset) {
  //selectedTabset.tabs.forEach((t: Tab) => {
  for (const t of selectedTabset.tabs) {
    if (t.url && !t.url.startsWith("chrome")) {
      // console.log("checking HEAD", t.url)
      try {
        const response = await fetch(t.url, {
          method: 'HEAD',
          cache: 'no-cache',
//          mode: 'no-cors',
          redirect: 'manual'
        })
        //console.log("got response", t.url)
        const oldLastModified = t.httpLastModified

        t.httpStatus = response.status
        t.httpContentType = response.headers.get("content-type") || 'unknown'
        t.httpLastModified = response.headers.get("Last-Modified") || 'unknown'
        t.httpCheckedAt = new Date().getTime()

        if (response.status !== 200) {
          // console.log(`checking HEAD found status ${response.status} for url ${t.url}`)
        }

        try {
          if (t.httpLastModified && oldLastModified) {
            if (Date.parse(t.httpLastModified) > Date.parse(oldLastModified)) {
              t.httpInfo = "UPDATED"
            }
          }
        } catch (err) {
        }
      } catch (error) {
        console.debug('got a Problem fetching url "' + t.url + '": \n', error)
        //t.httpError = error.toString()
        //return Promise.resolve()
      }
    }
  }
  useTabsetService().saveTabset(selectedTabset)
}

const openNote = (note: Note) => {
  const url = chrome.runtime.getURL(`/www/index.html#/mainpanel/notes/${note.id}`)
  NavigationService.openOrCreateTab([url])
}

if (inBexMode()) {
  // seems we need to define these listeners here to get the matching messages reliably
  // these messages are created by triggering events in the mainpanel
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //console.log(" <<< received message", message)
    if (message.name === "note-changed") {
      useNotesStore().getNotesFor(currentTabsetId.value!)
        .then((ns: Note[]) => notes.value = ns)
    }
  })
}


</script>
