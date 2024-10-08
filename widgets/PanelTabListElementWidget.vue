<template>

  <!-- left part: icon plus various -->
  <q-item-section v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.SOME, props.tabset?.details)"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined"
                  class="q-mr-sm text-right" style="justify-content:start;width:30px;max-width:30px">
    <div class="bg-grey-3 q-pa-none" :style="iconStyle()">

      <transition name="fade" mode="out-in">
        <div v-if="newState" key="newState">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.8 20.8">
            <circle class="checkmark__circle" cx="10.4" cy="10.4" r="10" fill="none"/>
            <path class="checkmark__check" fill="none" d="M5.64 10.88l2.84 2.88 6.68-6.72"/>
          </svg>
        </div>
        <div v-else key="oldState" class="flex-center">
          <q-img v-if="props.tab.preview === TabPreview.THUMBNAIL"
                 @dblclick="togglePreview()"
                 :src="thumbnail" width="30px"/>
          <TabFaviconWidget v-else style="margin: auto;display: block;"
                            @dblclick="togglePreview()"
                            :preventDragAndDrop="props.preventDragAndDrop"
                            :tab="props.tab" width="20px" height="20px"/>
        </div>
      </transition>

    </div>
    <div v-if="props.tab?.httpInfo === 'UPDATED'"
         class="q-my-xs q-mx-none q-pa-none text-white bg-positive items-center justify-center"
         style="border-radius: 3px;max-height:15px;font-size:8px;text-align: center;">
      NEW
      <q-tooltip class="tooltip">This page indicates that its content has changed in the meantime.</q-tooltip>
    </div>
    <div v-else-if="props.tab?.httpStatus >= 300 && !props.tab?.placeholders"
         class="q-my-xs q-mx-none q-pa-none text-white items-center justify-center"
         :class="props.tab?.httpStatus >= 500 ? 'bg-red' : 'bg-warning'"
         style="border-radius: 3px;max-height:15px;font-size:8px;text-align: center;">
      {{ props.tab.httpStatus }}
      <q-tooltip class="tooltip">Tabsets has problems accessing this site.</q-tooltip>
    </div>

  </q-item-section>

  <!-- right part: name, title, description, url && note -->
  <q-item-section class="q-mb-sm"
                  :style="TabService.isCurrentTab(props.tab) ? 'border-right:2px solid #1565C0' : ''"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined">

    <!-- === name or title === -->
    <q-item-label>
      <div class="row">

        <div class="col-11 q-pr-lg cursor-pointer ellipsis" @click.stop="gotoTab()">
          <span v-if="props.header" class="text-caption">{{ props.header }}<br></span>
          <!--          <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalTitle'">-->
          <span v-if="props.sorting === TabSorting.TITLE">
              <q-icon name="arrow_right" size="16px"/>
           </span>

          <span v-if="props.tab?.extension === UrlExtension.NOTE"
                v-html="nameOrTitle(props.tab as Tab)"/>
          <span v-else :class="TabService.isCurrentTab(props.tab) ? 'text-bold text-blue-9':''">
            <q-icon v-if="props.tab?.favorite && props.tab?.favorite !== TabFavorite.NONE"
                    :color="props.tab.favorite === TabFavorite.TABSET ? 'warning':'positive'"
                    name="star" class="q-ma-mone">
              <q-tooltip class="tooltip_small">This tab is marked as favorite</q-tooltip>
            </q-icon>
            {{ nameOrTitle(props.tab as Tab) }}</span>
          <q-popup-edit
            v-if="popModel && props.tab?.extension !== UrlExtension.NOTE && !props.tab.placeholders"
            :model-value="nameOrTitle(props.tab as Tab)" v-slot="scope"
            @update:model-value="(val:string) => setCustomTitle( tab, val)">
            <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
          </q-popup-edit>

        </div>

        <div class="col text-right q-mr-md">
          <span>
              <q-icon name="more_vert" class="cursor-pointer" color="black" size="16px"/>
            </span>
          <PanelTabListContextMenu
            :tabset="props.tabset"
            :tabsetId="props.tabsetId"
            :tab="tab" v-if="!props.hideMenu"/>
        </div>
      </div>
    </q-item-label>

    <!-- === description === -->
    <template v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.SOME, props.tabset?.details)">
      <template v-if="props.tab?.extension !== UrlExtension.NOTE">
        <q-item-label class="ellipsis-2-lines text-body2 darkColors lightColors"

                      @click.stop="gotoTab()">
          {{ props.tab.longDescription || props.tab.description }}
        </q-item-label>
      </template>
      <template else>
        <q-item-label class="ellipsis-2-lines text-grey-8"

                      @click.stop="gotoTab()">
          {{ props.tab.description }}
        </q-item-label>
      </template>
    </template>

    <!-- === url(s) === -->
    <q-item-label
      style="width:100%"
      v-if="props.tab?.url"
      caption class="ellipsis-2-lines text-blue-10 q-pt-xs"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none">
        <div class="col-12 q-pr-lg cursor-pointer" @click="gotoTab()">
           <span v-if="props.sorting === TabSorting.URL">
              <q-icon name="arrow_right" size="16px"/>
           </span>

          <template v-if="props.tab.extension !== UrlExtension.NOTE">
            <short-url @click.stop="gotoTab()"
                       :url="props.tab.url" :hostname-only="!useUiStore().showFullUrls"/>
            <q-icon v-if="props.tab.matcher && useFeaturesStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT)"
                    @click.stop="openTabAssignmentPage(props.tab)"
                    name="o_settings">
              <q-tooltip class="tooltip">{{ matcherTooltip() }}</q-tooltip>
            </q-icon>
            <!-- <q-icon class="q-ml-xs" name="open_in_new"/>-->
            <ul v-if="placeholders.length > 0">
              <div v-for="placeholder in placeholders">
                <li>
                  <short-url
                    @click.stop="NavigationService.openOrCreateTab(
                          [placeholder['url' as keyof object]],
                          props.tab.matcher,
                          props.tab.groupName ? [props.tab.groupName] : [] )"
                    :label="placeholder['name' as keyof object]"
                    :url="placeholder['url' as keyof object]"/>
                </li>
              </div>
            </ul>
          </template>

        </div>
      </div>

    </q-item-label>

    <!-- === group, last active & icons === -->
    <q-item-label
      style="width:100%;margin-top:0"
      v-if="props.tab?.url"
      caption class="ellipsis-2-lines text-blue-10"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none" @click="gotoTab()">
        <div class="col-12 q-pr-lg q-mt-none q-pt-none cursor-pointer">
          <div class="text-caption text-grey-5 ellipsis">

            <span v-if="props.sorting === TabSorting.AGE">
              <q-icon name="arrow_right" size="16px"/>
            </span>

            <q-icon v-if="suggestion"
                    @click.stop="showSuggestion()"
                    name="o_notifications" class="q-mr-xs" size="xs"
                    :color="suggestion.state === SuggestionState.NOTIFICATION ? 'negative' : 'accent'">
              <q-tooltip class="tooltip-small" v-if="suggestion.state === SuggestionState.NOTIFICATION">There is a new
                notification for this tab
              </q-tooltip>
              <q-tooltip class="tooltip-small" v-else>There is a notification for this tab</q-tooltip>
            </q-icon>

            <q-icon v-if="pngs.length > 0"
                    @click.stop="openImage()" size="xs"
                    name="o_image" class="q-mr-xs" color="accent">
              <q-tooltip class="tooltip-small">There are snapshot images of this tab</q-tooltip>
            </q-icon>

            <q-icon v-if="(props.tab as Tab).placeholders" size="xs"
                    name="published_with_changes" class="q-mr-xs" color="accent">
              <q-tooltip class="tooltip-small">This tab is created by substituting parts of its URL</q-tooltip>
            </q-icon>

            <q-icon v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 0" size="xs"
                    name="o_chat" class="q-mr-xs" color="warning" @click.stop="toggleLists('comments')">
              <q-tooltip class="tooltip-small">This tab has comments</q-tooltip>
            </q-icon>
            <span v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 1"
                  @click.stop="toggleLists('comments')"
                  class="q-mr-sm">({{ (props.tab as Tab).comments.length }})</span>


            <template v-if="groupName && useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)">
              Group <em>{{ groupName }}</em>
              <q-icon name="arrow_drop_down" class="q-mr-none" size="xs" color="text-grey-5"/>
              <q-menu :offset="[0,10]">
                <q-list dense>
                  <q-item v-if="groups.size > 1" class="text-grey-5" style="font-size: smaller">
                    Change group to...
                  </q-item>
                  <q-item clickable v-for="group in groupsWithout(groupName)"
                          @click="switchGroup(group)"
                          style="font-size: smaller">
                    ...{{ group.title }}
                  </q-item>
                  <q-separator v-if="groups.size > 1"/>
                  <q-item clickable style="font-size: smaller" @click="unsetGroup()">
                    Unset Group
                  </q-item>
                  <q-separator/>
                  <q-item clickable style="font-size: smaller" @click="removeGroup(groupName)">
                    Remove Group
                  </q-item>
                </q-list>
              </q-menu>
              -
            </template>

            <span>
              <TabListIconIndicatorsHook :tabId="props.tab.id" :tabUrl="props.tab.url"/>
              <span v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.MAXIMAL, props.tabset?.details)">last active: {{
                  formatDate(props.tab.lastActive)
                }}</span>
            </span>

          </div>
        </div>
      </div>
    </q-item-label>

    <!-- === comments === -->
    <q-item-label v-if="showComments()"
                  class="text-grey-10" text-subtitle1>
      <q-chat-message v-for="m in props.tab.comments"
                      :name="m.author"
                      @click="selectComment(m.id)"
                      :avatar="m.avatar || 'http://www.gravatar.com/avatar'"
                      :text="[m.comment]"
                      :sent="isSender(m)"
                      :bg-color="m.id === selectedCommentId ? 'warning' : isSender(m) ? 'blue':'grey-2'"
                      :text-color="isSender(m) ? 'white':'black'"
                      :stamp="formatDate(m.date)"
      />
      <div class="row">
        <div class="col-12 text-right q-mr-lg text-caption">
          <span v-if="selectedCommentId" @click.stop="deleteSelectedComment()">Delete Comment</span>
          <span v-else @click="addCommentDialog()">Reply</span>
        </div>
      </div>
    </q-item-label>

    <!-- === badges === -->
    <q-item-label v-if="props.showTabsets">
      <template v-for="badge in tsBadges">
        <q-chip clickable @click.stop="openTabset(badge)"
                class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
          {{ badge['label' as keyof object] }}
        </q-chip>
      </template>
    </q-item-label>

  </q-item-section>
</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {
  HTMLSelection,
  HTMLSelectionComment,
  Tab,
  TabComment,
  TabFavorite,
  TabPreview,
  TabSorting,
  UrlExtension
} from "src/tabsets/models/Tab";
import TabsetService from "src/tabsets/services/TabsetService";
import {onMounted, PropType, ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {ListDetailLevel, useUiStore} from "src/ui/stores/uiStore";
import TabFaviconWidget from "src/tabsets/widgets/TabFaviconWidget.vue";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import ShortUrl from "src/core/utils/ShortUrl.vue";
import PanelTabListContextMenu from "src/tabsets/widgets/PanelTabListContextMenu.vue";
import _ from "lodash";
import {formatDistance} from "date-fns";
import {Tabset} from "src/tabsets/models/Tabset";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useUtils} from "src/core/services/Utils";
import {useRouter} from "vue-router";
import {useGroupsStore} from "src/tabsets/stores/groupsStore";
import {DeleteChromeGroupCommand} from "src/tabsets/commands/DeleteChromeGroupCommand";
import {PlaceholdersType} from "src/tabsets/models/Placeholders";
import {useQuasar} from "quasar";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {Suggestion, SuggestionState} from "src/suggestions/models/Suggestion";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import TabService from "src/services/TabService";
import {DeleteCommentCommand} from "src/domain/tabs/DeleteCommentCommand";
import {UpdateTabNameCommand} from "src/domain/tabs/UpdateTabName";
import {SavedBlob} from "src/snapshots/models/SavedBlob";
import {useThumbnailsService} from "src/thumbnails/services/ThumbnailsService";
import CommentDialog from "src/tabsets/dialogues/CommentDialog.vue";
import TabListIconIndicatorsHook from "src/app/hooks/tabsets/TabListIconIndicatorsHook.vue";

const {inBexMode} = useUtils()

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  header: {type: String, required: false},
  type: {type: String, default: 'sidepanel'},
  hideMenu: {type: Boolean, default: false},
  sorting: {type: String as PropType<TabSorting>, default: TabSorting.CUSTOM},
  showTabsets: {type: Boolean, default: false},
  preventDragAndDrop: {type: Boolean, default: false},
  tabset: {type: Object as PropType<Tabset>, required: false},
  tabsetId: {type: String, required: false}
})

const $q = useQuasar()
const cnt = ref(0)
const router = useRouter()

const showButtonsProp = ref<boolean>(false)
const thumbnail = ref<string | undefined>(undefined)
const hoveredTab = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const newState = ref(false)
const showAnnotationList = ref(false)
const showCommentList = ref(false)
const groupName = ref<string | undefined>(undefined)
const groups = ref<Map<string, chrome.tabGroups.TabGroup>>(new Map())
const placeholders = ref<Object[]>([])
const suggestion = ref<Suggestion | undefined>(undefined)
const pngs = ref<SavedBlob[]>([])
const selectedAnnotation = ref<HTMLSelection | undefined>(undefined)
const newComment = ref("")
const selectedCommentId = ref<string | undefined>(undefined)
const popModel = ref(false)

onMounted(() => {
  if ((new Date().getTime() - props.tab.created) < 500) {
    newState.value = true
    const audio = document.getElementById('myAudio')
    if (audio) {
      // @ts-ignore
      audio.play()
    }
    setTimeout(() => newState.value = false, 2000)
  }
})

const thumbnailFor = async (tab: Tab): Promise<string> => {
  return useThumbnailsService().getThumbnailFor(tab.id)
}

watchEffect(() => {
  if (props.tab && props.tab.preview === TabPreview.THUMBNAIL) {
    // @ts-ignore
    thumbnailFor(props.tab)
      .then((tn: string) => {
        if (tn) {
          thumbnail.value = tn
        }
      })
      .catch((err) => {
        //console.log("could not get thumbnail for ", props.tab)
      })
  }
})


watchEffect(() => {
  if (selectedAnnotation.value && newComment.value && newComment.value.trim() !== '') {
    selectedAnnotation.value.comments.push(
      new HTMLSelectionComment("author", newComment.value)
    )
    useTabsetService().saveCurrentTabset()
  }
})
watchEffect(() => {
  groups.value = useGroupsStore().tabGroups
})

watchEffect(() => {
  groupName.value = props.tab?.groupName
})

watchEffect(() => {
  if (props.tab.url) {
    suggestion.value = useSuggestionsStore().getSuggestionForUrl(props.tab.url)
  }
})

watchEffect(() => {
  if (props.tab && props.tab.url) {
    cnt.value = cnt.value + 1
    const url = props.tab.url
    const tabsetIds = useTabsetService().tabsetsFor(url)
    tsBadges.value = []
    _.forEach(tabsetIds, (tsId: string) => tsBadges.value.push({
      label: TabsetService.nameForTabsetId(tsId),
      tabsetId: tsId,
      encodedUrl: btoa(url || '')
    }))
  }
})

watchEffect(() => {
  if (props.tab) {
    const t = props.tab
    //console.log("placeholders", t.placeholders)
    if (t.placeholders && t.placeholders.type === PlaceholdersType.URL_SUBSTITUTION) {
      const subs = t.placeholders.config
      Object.entries(subs).forEach(e => {
        console.log("got e", e)
        const name = e[0]
        const val = e[1]
        val.split(",").forEach((v: string) => {
          const substitution = v.trim()
          if (substitution.length > 0) {
            let useUrl = t.url || ''
            let useName = t.name || t.title || ''
            Object.entries(subs).forEach(e1 => {
              useUrl = useUrl.replaceAll("${" + name + "}", substitution)
              useName = useName.replaceAll("${" + name + "}", substitution)
            })
            placeholders.value.push({url: useUrl, name: substitution})
          }
        })
      })
    }
  }
  //console.log("===>", placeholders.value)
})

watchEffect(async () => {
  if (props.tab) {
    //pngs.value = await useSnapshotsService().getPngsForTab(props.tab.id)
  }
})

const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.title

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

const iconStyle = () => {
  if (TabService.isCurrentTab(props.tab)) {
    return "border:1px solid #bfbfbf;border-radius:3px"
  } else {
    return "border:0px solid white;border-radius:3px"
  }
}

const openTabset = (badge: any) => {
  console.log("clicked badge", badge)
  useTabsetService().selectTabset(badge.tabsetId)
  // @ts-ignore
  if (!inBexMode() || !chrome.sidePanel) {
    router.push("/tabsets/" + badge.tabsetId + "?highlight=" + badge.encodedUrl)
  } else {
    router.push("/sidepanel" + "?highlight=" + badge.encodedUrl)
  }
}

const openTabAssignmentPage = (tab: Tab) =>
  NavigationService.openOrCreateTab([chrome.runtime.getURL("/www/index.html#/mainpanel/tabAssignment/" + tab.id)])

const matcherTooltip = () => {
  const split = props.tab.matcher?.split("|")
  if (split && split.length > 1) {
    if (split[0] === 'sw') { // 'sw' = 'startsWith'
      return "This tab will open in any tab with an URL starting with " + split[1]
    }
  }
  return "This tab will open in any tab which url matches " + props.tab.matcher
}

const unsetGroup = () => {
  if (props.tab) {
    props.tab.groupName = undefined
    const res = useTabsetsStore().getTabAndTabsetId(props.tab.id)
    //.then((res: TabAndTabsetId | undefined) => {
    if (res) {
      const tab = res.tab
      const tabsetId = res.tabsetId
      tab.groupName = undefined
      tab.groupId = -1
      const ts = useTabsetsStore().getTabset(tabsetId)
      if (ts) {
        useTabsetService().saveTabset(ts)
      }
    }
    // })
  }
}

const removeGroup = (groupName: string) => {
  unsetGroup()
  if (props.tab && groupName) {
    useCommandExecutor().executeFromUi(new DeleteChromeGroupCommand(groupName))
  }
}

const groupsWithout = (groupName: string): chrome.tabGroups.TabGroup[] =>
  _.filter([...groups.value.values()], (g: chrome.tabGroups.TabGroup) => g.title !== groupName)

const switchGroup = (group: chrome.tabGroups.TabGroup): void => {
  if (props.tab) {
    props.tab.groupName = group.title
    const res = useTabsetsStore().getTabAndTabsetId(props.tab.id)
    // .then((res: TabAndTabsetId | undefined) => {
    if (res) {
      const tab = res.tab
      const tabsetId = res.tabsetId
      tab.groupName = group.title
      tab.groupId = group.id
      const ts = useTabsetsStore().getTabset(tabsetId)
      if (ts) {
        useTabsetService().saveTabset(ts)
      }
    }
    // })
  }
}

const gotoTab = () =>
  NavigationService.openOrCreateTab(
    [props.tab.url || ''],
    props.tab.matcher,
    props.tab.groupName ? [props.tab.groupName] : [])

const showSuggestion = () => {
  const url = chrome.runtime.getURL('www/index.html') + "#/mainpanel/suggestions/" + suggestion.value?.id
  NavigationService.openOrCreateTab([url])
}

const openImage = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/png/' + props.tab.id + "/" + pngs.value[0].id))

// const deleteAnnotation = async (tab: Tab, annotationToDelete: any) => {
//   //console.log("deleting annotatin", tab, annotationToDelete)
//   tab.annotations = _.filter(tab.annotations, (a:any) => a.id !== annotationToDelete.id)
//   useTabsetService().saveCurrentTabset()
// }

const showComments = () =>
  showCommentList.value &&
  useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.SOME, props.tabset?.details) &&
  (props.tab as Tab).comments && (props.tab as Tab).comments.length > 0

const toggleLists = (ident: string) => {
  switch (ident) {
    case 'annotations':
      showCommentList.value = false
      showAnnotationList.value = !showAnnotationList.value
      break
    case 'comments':
      showAnnotationList.value = false
      showCommentList.value = !showCommentList.value
      break
    default:
      console.log("undefined ident for toggle lists", ident)
      break
  }
}

const isSender = (m: TabComment) => m.author === useUiStore().sharingAuthor

const addCommentDialog = () => $q.dialog({
  component: CommentDialog,
  componentProps: {tabId: props.tab.id, sharedId: props.tabset?.sharedId}
})

const togglePreview = () => {
  if (props.tab) {
    props.tab.preview = (props.tab.preview === undefined || props.tab.preview === TabPreview.FAVICON) ?
      TabPreview.THUMBNAIL : TabPreview.FAVICON
    useTabsetService().saveCurrentTabset()
  }
}

const selectComment = (commentId: string) => selectedCommentId.value = commentId

const deleteSelectedComment = () => {
  if (selectedCommentId.value) {
    useCommandExecutor().executeFromUi(new DeleteCommentCommand(props.tab.id, selectedCommentId.value))
    selectedCommentId.value = undefined
  }
}

const setCustomTitle = (tab: Tab, newValue: string) =>
  useCommandExecutor().executeFromUi(new UpdateTabNameCommand(tab, newValue))

</script>

<!--https://stackoverflow.com/questions/41078478/css-animated-checkmark -->
<style lang="scss" scoped>

.body--dark .darkColors {
  color: $grey-2;
}

.body--light .lightColors {
  color: $grey-9;
}

.checkmark__circle {
  stroke-dasharray: 66;
  stroke-dashoffset: 66;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #8ACB88;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}


.checkmark {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #fff;
  stroke-miterlimit: 10;
  margin: 10% auto;
  box-shadow: inset 0 0 0 #8ACB88;
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0 0 0 30px #8ACB88;
  }
}
</style>
