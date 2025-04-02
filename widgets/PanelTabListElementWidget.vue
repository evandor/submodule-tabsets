<template>
  <!-- left part: icon plus various -->
  <q-item-section
    @mouseover="hoveredTab = tab.id"
    @mouseleave="hoveredTab = undefined"
    class="q-mr-none q-mt-xs text-left"
    style="justify-content: start; width: 36px; max-width: 36px; max-height: 24px">
    <div class="q-pa-none" style="border: 0 solid white; border-radius: 3px">
      <transition name="fade" mode="out-in" v-once>
        <div v-if="newState" key="newState">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.8 20.8">
            <circle class="checkmark__circle" cx="10.4" cy="10.4" r="10" fill="none" />
            <path class="checkmark__check" fill="none" d="M5.64 10.88l2.84 2.88 6.68-6.72" />
          </svg>
        </div>
        <div v-else key="oldState" class="flex-center">
          <q-img
            v-if="props.tab.preview === TabPreview.THUMBNAIL"
            @dblclick="togglePreview()"
            :src="thumbnail"
            width="30px" />
          <TabFaviconWidget
            v-else
            v-once
            style="margin: auto; display: block"
            @dblclick="togglePreview()"
            :preventDragAndDrop="props.preventDragAndDrop"
            :tab="props.tab"
            width="20px"
            height="20px" />
        </div>
      </transition>
    </div>
    <template v-if="useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)">
      <div
        v-if="props.tab?.httpInfo === 'UPDATED'"
        class="q-my-xs q-mx-none q-pa-none text-white bg-positive items-center justify-center"
        style="border-radius: 3px; max-height: 15px; font-size: 8px; text-align: center">
        NEW
        <q-tooltip class="tooltip">This page indicates that its content has changed in the meantime.</q-tooltip>
      </div>
      <div
        v-else-if="(props.tab?.httpStatus >= 300 || props.tab?.httpStatus === 0) && !props.tab?.placeholders"
        class="q-my-xs q-mx-none q-pa-none text-white items-center justify-center"
        :class="props.tab?.httpStatus >= 500 ? 'bg-red' : 'bg-warning'"
        style="border-radius: 3px; max-height: 15px; font-size: 8px; text-align: center">
        {{ props.tab.httpStatus }}
        <q-tooltip class="tooltip">Tabsets has problems accessing this site.</q-tooltip>
      </div>
      <div v-if="props.tab.reminder || monitor" class="text-center">
        <q-icon v-if="props.tab.reminder" name="o_alarm" @click="openReminderDialog()" size="14px">
          <q-tooltip class="tooltip-small"
            >Reminder set to {{ quasarDate.formatDate(props.tab.reminder, 'DD.MM.YYYY') }}
            {{ props.tab.reminderComment ? ' - ' : '' }} {{ props.tab.reminderComment }}
          </q-tooltip>
        </q-icon>
        <q-icon
          v-if="monitor"
          :name="monitor.changed ? 'o_notifications_active' : 'o_notifications'"
          :color="monitor.changed ? 'negative' : ''"
          size="14px">
          <q-tooltip v-if="monitor.changed" class="tooltip-small"
            >Tab's content has changed at {{ quasarDate.formatDate(monitor.changed, 'DD.MM.YYYY') }}
          </q-tooltip>
          <q-tooltip v-else class="tooltip-small">Tab is being monitored for content changes</q-tooltip>
        </q-icon>
      </div>
    </template>
  </q-item-section>

  <!-- middle part: name, title, description, url && note -->
  <q-item-section
    class="q-mb-xs q-mt-xs q-mx-none q-pa-none"
    @mouseover="hoveredTab = tab.id"
    @mouseleave="hoveredTab = undefined">
    <!-- === name or title === -->
    <q-item-label @click.stop="gotoTab()">
      <div class="row">
        <div class="col-11 q-pr-none q-mr-none cursor-pointer ellipsis fit">
          <span v-if="props.header" class="text-caption">{{ props.header }}<br /></span>
          <!--          <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalTitle'">-->
          <span v-if="props.sorting === TabSorting.TITLE">
            <q-icon name="arrow_right" size="16px" />
          </span>

          <span v-if="props.tab?.extension === UrlExtension.NOTE" v-html="nameOrTitle(props.tab as Tab)" />
          <span v-else :class="TabService.isCurrentTab(props.tab) ? 'text-bold' : ''" @click.stop="handleNameClick">
            <q-icon
              v-if="props.tab?.favorite && props.tab?.favorite !== TabFavorite.NONE"
              :color="props.tab.favorite === TabFavorite.TABSET ? 'warning' : 'positive'"
              name="star"
              class="q-ma-mone">
              <q-tooltip class="tooltip_small">This tab is marked as favorite</q-tooltip>
            </q-icon>
            <Highlight :filter="props.filter" :text="nameOrTitle(props.tab as Tab) || ''">
              <template v-slot:popup>
                <q-popup-edit
                  v-if="popupEdit"
                  ref="popupRef"
                  @hide="popupEdit = false"
                  :model-value="nameOrTitle(props.tab as Tab)"
                  @update:model-value="(val: string) => setCustomTitle(tab, val)"
                  v-slot="scope"
                  anchor="center middle">
                  <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
                </q-popup-edit>
              </template>
            </Highlight>
          </span>
        </div>
      </div>
    </q-item-label>

    <!-- === created by === -->
    <q-item-label v-if="props.tab?.createdBy && props.tab.createdBy !== useAuthStore().user.email">
      <div class="text-body2 ellipsis" style="font-size: x-small">created by {{ props.tab.createdBy }}</div>
    </q-item-label>

    <!-- === description === -->
    <template v-if="useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)">
      <template v-if="props.tab?.extension !== UrlExtension.NOTE">
        <q-item-label
          class="ellipsis-2-lines text-body2 darkColors lightColors"
          :class="props.tab?.extension === UrlExtension.RSS ? 'ellipsis-3-lines' : 'ellipsis-2-lines'"
          @click.stop="gotoTab()">
          <Highlight :filter="props.filter" :text="props.tab.longDescription || props.tab.description || ''" />
        </q-item-label>
      </template>
      <template v-else>
        <q-item-label class="ellipsis-2-lines text-grey-8" @click.stop="gotoTab()">
          {{ props.tab.description }}
        </q-item-label>
      </template>
    </template>

    <!-- === RestTab === -->
    <div v-if="'params' in props.tab && 'api' in props.tab">
      <!--      <div v-for="p in props.tab.params">-->
      <!--        <q-input type="text" v-model="p['val' as keyof object]" :label="p['name' as keyof object]" />-->
      <!--      </div>-->
      <div>
        <q-btn label="Call API" type="submit" @click="callRestApi(props.tab)" size="xs" />
      </div>
    </div>

    <!-- === open search === -->
    <q-item-label
      v-if="showOpenSearchInput() && useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)">
      <div class="row q-ma-none q-pa-none q-my-xs">
        <div class="col-5 text-body2" style="font-size: smaller">
          <em>Direct Search:</em>
        </div>
        <div class="col-6">
          <form @submit.prevent="openSearch()">
            <input
              type="text"
              v-model="opensearchterm"
              autocomplete="on"
              :id="'opensearch_' + props.tab.id"
              :style="
                $q.dark.isActive ? 'background-color:#282828;color:white' : 'background-color:#F0F0F0;color-primary'
              "
              style="
                max-height: 20px;
                border: 0 solid white;
                border-bottom: 1px solid #c0c0c0;
                font-size: 12px;
                border-radius: 3px;
              " />
          </form>
        </div>
        <div class="col text-right">
          <q-btn icon="search" flat size="xs" @click="openSearch()" />
        </div>
      </div>
    </q-item-label>

    <!-- === RSS Links === -->
    <Transition name="fade" mode="out-in">
      <q-item-label v-if="showRssReferencesInfo()">
        <div
          class="row q-ma-none q-pa-none q-my-xs"
          v-for="ref in props.tab?.tabReferences.filter(
            (r: TabReference) => r.type === TabReferenceType.RSS && r.status !== 'IGNORED',
          )">
          <div class="col-1 text-body2" style="font-size: smaller">
            <q-icon name="rss_feed" class="q-ma-none q-pa-none" color="warning" size="xs" />
          </div>
          <div
            class="col-7 ellipsis"
            style="font-size: smaller"
            @click="useNavigationService().browserTabFor(ref.href!)">
            {{ ref.title }}
          </div>
          <div class="col text-right">
            <q-btn icon="o_open_in_new" flat size="xs" class="q-ma-none q-pa-none" @click="openRssLink(ref)" />
            <q-btn icon="o_close" flat size="xs" class="q-ma-none q-pa-none" @click="ignore(ref)" />
          </div>
        </div>
      </q-item-label>
    </Transition>

    <!-- === url(s) === -->
    <q-item-label
      style="width: 100%"
      v-if="props.tab?.url && useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)"
      caption
      class="ellipsis-2-lines text-accent q-pt-xs"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none">
        <div class="col-12 q-pr-lg q-mb-xs cursor-pointer" @click="gotoTab()">
          <span v-if="props.sorting === TabSorting.URL">
            <q-icon name="arrow_right" size="16px" />
          </span>

          <template v-if="props.tab.extension !== UrlExtension.RSS">
            <short-url
              @click.stop="gotoTab()"
              :url="props.tab.url"
              :hostname-only="!useUiStore().showFullUrls"
              :filter="props.filter || ''" />
            <q-icon
              v-if="props.tab.matcher && useFeaturesStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT)"
              @click.stop="openTabAssignmentPage(props.tab)"
              name="o_settings">
              <q-tooltip class="tooltip">{{ matcherTooltip() }}</q-tooltip>
            </q-icon>
            <span v-if="showReadingMode()" class="cursor-pointer" @click.stop="showInReadingMode()">
              [Reading Mode]
            </span>
            <!-- <q-icon class="q-ml-xs" name="open_in_new"/>-->
            <ul v-if="placeholders.length > 0">
              <div v-for="placeholder in placeholders">
                <li>
                  <short-url
                    @click.stop="
                      NavigationService.openOrCreateTab(
                        [placeholder['url' as keyof object]],
                        props.tab.matcher,
                        props.tab.groupName ? [props.tab.groupName] : [],
                      )
                    "
                    :label="placeholder['name' as keyof object]"
                    :url="placeholder['url' as keyof object]"
                    :hostname-only="true"
                    :filter="props.filter" />
                </li>
              </div>
            </ul>
          </template>
        </div>
      </div>
    </q-item-label>

    <!-- === group, last active & icons === -->
    <q-item-label
      style="width: 100%; margin-top: 0"
      v-if="props.tab?.url && useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)"
      caption
      class="ellipsis-2-lines text-accent"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none" @click="gotoTab()">
        <div class="col-12 q-pr-lg q-mt-none q-pt-none cursor-pointer">
          <div class="text-caption text-grey-5 ellipsis">
            <span v-if="props.sorting === TabSorting.AGE">
              <q-icon name="arrow_right" size="16px" />
            </span>

            <q-icon
              v-if="suggestion"
              @click.stop="showSuggestion()"
              name="o_notifications"
              class="q-mr-xs"
              size="xs"
              :color="suggestion.state === 'NOTIFICATION' ? 'negative' : 'accent'">
              <q-tooltip class="tooltip-small" v-if="suggestion.state === 'NOTIFICATION'"
                >There is a new notification for this tab
              </q-tooltip>
              <q-tooltip class="tooltip-small" v-else>There is a notification for this tab</q-tooltip>
            </q-icon>

            <q-icon
              v-if="pngs.length > 0"
              @click.stop="openImage()"
              size="xs"
              name="o_image"
              class="q-mr-xs"
              color="accent">
              <q-tooltip class="tooltip-small">There are snapshot images of this tab</q-tooltip>
            </q-icon>

            <q-icon
              v-if="(props.tab as Tab).placeholders"
              size="xs"
              name="published_with_changes"
              class="q-mr-xs"
              color="accent">
              <q-tooltip class="tooltip-small">This tab is created by substituting parts of its URL</q-tooltip>
            </q-icon>

            <q-btn
              v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 0"
              @click.stop="toggleLists('comments')"
              class="q-mr-xs q-mt-xs"
              color="warning"
              dense
              round
              flat
              icon="o_chat">
              <q-tooltip class="tooltip-small"
                >This tab has {{ newCommentIds.length > 0 ? 'new' : '' }} comments
              </q-tooltip>
              <q-badge v-if="newCommentIds.length > 0" color="accent" rounded floating transparent>
                {{ newCommentIds.length }}
              </q-badge>
            </q-btn>

            <span
              v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 1"
              @click.stop="toggleLists('comments')"
              class="q-mr-sm q-ml-none"
              >({{ (props.tab as Tab).comments.length }})</span
            >

            <template v-if="groupName && useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)">
              Group <em>{{ groupName }}</em>
              <q-icon name="arrow_drop_down" class="q-mr-none" size="xs" color="text-grey-5" />
              <q-menu :offset="[0, 10]">
                <q-list dense>
                  <q-item v-if="groups.size > 1" class="text-grey-5" style="font-size: smaller">
                    Change group to...
                  </q-item>
                  <q-item
                    clickable
                    v-for="group in groupsWithout(groupName)"
                    @click="switchGroup(group)"
                    style="font-size: smaller">
                    ...{{ group.title }}
                  </q-item>
                  <q-separator v-if="groups.size > 1" />
                  <q-item clickable style="font-size: smaller" @click="unsetGroup()"> Unset Group</q-item>
                  <q-separator />
                  <q-item clickable style="font-size: smaller" @click="removeGroup(groupName)"> Remove Group</q-item>
                </q-list>
              </q-menu>
              -
            </template>

            <span>
              <TabListIconIndicatorsHook :tabId="props.tab.id" :tabUrl="props.tab.url" />
              <span
                v-if="
                  props.tab.extension !== UrlExtension.RSS &&
                  useUiStore().listDetailLevelGreaterEqual('MAXIMAL', props.tabset?.details)
                "
                >last active: {{ formatDate(props.tab.lastActive) }}</span
              >
              <span v-else-if="props.tab.extension === UrlExtension.RSS"
                >published: {{ formatDate(props.tab.created) }}</span
              >
            </span>
          </div>
        </div>
      </div>
    </q-item-label>

    <!-- === comments === -->
    <q-item-label v-if="showComments()" class="text-grey-5">
      <CommentChatMessages :comments="oldComments()" :tab="props.tab" :tabset-id="props.tabsetId" />
      <h6 v-if="newComments().length > 0">new Message(s)</h6>
      <CommentChatMessages :comments="newComments()" :tab="props.tab" :tabset-id="props.tabsetId" />

      <div class="row">
        <div class="col-6 text-right">&nbsp;</div>
        <div class="col text-right">
          <q-input dense filled v-model="sendComment" />
        </div>
        <div class="col-1">
          <q-btn icon="send" size="sm" @click="send()" />
        </div>
      </div>
    </q-item-label>

    <!-- === snippets === -->
    <q-item-label
      v-if="useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)"
      class="text-grey-10"
      text-subtitle1>
      <div
        v-if="TabService.isCurrentTab(props.tab)"
        v-for="s in props.tab.snippets"
        class="ellipsis-2-lines q-my-xs text-body2">
        {{ s.text }}
      </div>
    </q-item-label>

    <!-- === badges === -->
    <q-item-label v-if="props.showTabsets">
      <template v-for="badge in tsBadges">
        <q-chip
          clickable
          @click.stop="openTabset(badge)"
          class="cursor-pointer q-ml-none q-mr-xs"
          size="9px"
          icon="tab">
          {{ badge['label' as keyof object] }}
        </q-chip>
      </template>
    </q-item-label>
  </q-item-section>

  <!-- right part -->
  <slot name="actionPart">
    <q-item-section
      class="q-ma-none q-pa-none text-right"
      @mouseover="hoveredTab = tab.id"
      @mouseleave="hoveredTab = undefined"
      :style="TabService.isCurrentTab(props.tab) ? 'border-right:3px solid #1565C0;border-radius:3px' : ''"
      style="justify-content: start; width: 30px; max-width: 30px">
      <span v-if="props.tabset && props.tabset.type !== TabsetType.SESSION">
        <!--        <q-icon name="more_vert" class="cursor-pointer q-mt-sm" color="black" size="20px" />-->
        <q-btn
          round
          flat
          outline
          text-color="primary"
          class="cursor-pointer q-mt-none q-mr-none"
          icon="more_vert"
          size="sm" />
        <PanelTabListContextMenu
          v-if="!props.hideMenu"
          :tabset="props.tabset!"
          :tabsetId="props.tabsetId!"
          :tab="tab" />
      </span>
      <span v-else @click="removeSessionTab(tab)"> x </span>
      <span
        v-if="tab.readingTime > 0 && useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)"
        class="text-grey-5 q-mt-sm"
        style="font-size: x-small">
        {{ formatReadingTime(tab.readingTime) }}
        <q-tooltip class="tooltip-small">cumulated reading time</q-tooltip>
      </span>
    </q-item-section>
  </slot>
</template>

<script setup lang="ts">
import { formatDistance } from 'date-fns'
import _ from 'lodash'
import { QPopupEdit, date as quasarDate, useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import TabListIconIndicatorsHook from 'src/app/hooks/tabsets/TabListIconIndicatorsHook.vue'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import ShortUrl from 'src/core/utils/ShortUrl.vue'
import { useEventsServices } from 'src/events/services/EventsServices'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { RestTab } from 'src/rest/models/RestTab'
import NavigationService from 'src/services/NavigationService'
import TabService from 'src/services/TabService'
import { SavedBlob } from 'src/snapshots/models/SavedBlob'
import { useAuthStore } from 'src/stores/authStore'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { AddCommentCommand } from 'src/tabsets/commands/AddCommentCommand'
import { DeleteChromeGroupCommand } from 'src/tabsets/commands/DeleteChromeGroupCommand'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { OpenTabCommand } from 'src/tabsets/commands/OpenTabCommand'
import { UpdateTabNameCommand } from 'src/tabsets/commands/UpdateTabName'
import ReminderDialog from 'src/tabsets/dialogues/ReminderDialog.vue'
import { PlaceholdersType } from 'src/tabsets/models/Placeholders'
import { Tab, TabComment, TabFavorite, TabPreview, TabSorting, UrlExtension } from 'src/tabsets/models/Tab'
import { MonitoredTab, Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useGroupsStore } from 'src/tabsets/stores/groupsStore'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import CommentChatMessages from 'src/tabsets/widgets/CommentChatMessages.vue'
import Highlight from 'src/tabsets/widgets/Highlight.vue'
import PanelTabListContextMenu from 'src/tabsets/widgets/PanelTabListContextMenu.vue'
import TabFaviconWidget from 'src/tabsets/widgets/TabFaviconWidget.vue'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { nextTick, onMounted, PropType, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { handleError } = useNotificationHandler()
const { inBexMode, useDblClickHandler } = useUtils()

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  header: { type: String, required: false },
  type: { type: String, default: 'sidepanel' },
  hideMenu: { type: Boolean, default: false },
  sorting: { type: String as PropType<TabSorting>, default: TabSorting.CUSTOM },
  showTabsets: { type: Boolean, default: false },
  preventDragAndDrop: { type: Boolean, default: false },
  tabset: { type: Object as PropType<Tabset>, required: false },
  tabsetId: { type: String, required: false },
  filter: { type: String, required: false },
})

const $q = useQuasar()
const cnt = ref(0)
const router = useRouter()

const showButtonsProp = ref<boolean>(false)
const thumbnail = ref<string | undefined>(undefined)
const hoveredTab = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const newState = ref(false)
const showCommentList = ref(false)
const groupName = ref<string | undefined>(undefined)
const groups = ref<Map<string, chrome.tabGroups.TabGroup>>(new Map())
const placeholders = ref<Object[]>([])
const suggestion = ref<Suggestion | undefined>(undefined)
const pngs = ref<SavedBlob[]>([])
const opensearchterm = ref<string | undefined>(undefined)
const sendComment = ref<string>('')
const newCommentIds = ref<string[]>([])
const monitor = ref<MonitoredTab | undefined>(undefined)
const popupEdit = ref(false)
const popupRef = ref<any>(undefined)

onMounted(() => {
  if (new Date().getTime() - props.tab.created < 500) {
    newState.value = true
    let playPromise: Promise<any> | undefined = undefined
    const audio = document.getElementById('myAudio')
    if (audio && !playPromise) {
      // @ts-expect-error TODO
      audio.play().catch((err) => {})
    }
    setTimeout(() => (newState.value = false), 2000)
  }
  if (props.tabsetId) {
    newCommentIds.value = useEventsServices().listNewComments(props.tabsetId, props.tab)
  }
  monitor.value =
    props.tabset &&
    props.tabset.monitoredTabs &&
    props.tabset.monitoredTabs.find((mt: MonitoredTab) => mt.tabId === props.tab.id)
})

const thumbnailFor = async (tab: Tab): Promise<string> => {
  return useThumbnailsService().getThumbnailFor(tab.id, useAuthStore().user.uid)
}

watchEffect(() => {
  if (props.tab && props.tab.preview === TabPreview.THUMBNAIL) {
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
    _.forEach(tabsetIds, (tsId: string) =>
      tsBadges.value.push({
        label: useTabsetService().nameForTabsetId(tsId),
        tabsetId: tsId,
        encodedUrl: btoa(url || ''),
      }),
    )
  }
})

watchEffect(() => {
  if (props.tab) {
    const t = props.tab
    //console.log("placeholders", t.placeholders)
    if (t.placeholders && t.placeholders.type === PlaceholdersType.URL_SUBSTITUTION) {
      const subs = t.placeholders.config
      Object.entries(subs).forEach((e) => {
        console.log('got e', e)
        const name = e[0]
        const val = e[1]
        val.split(',').forEach((v: string) => {
          const substitution = v.trim()
          if (substitution.length > 0) {
            let useUrl = t.url || ''
            let useName = t.name || t.title || ''
            Object.entries(subs).forEach((e1) => {
              useUrl = useUrl.replaceAll('${' + name + '}', substitution)
              useName = useName.replaceAll('${' + name + '}', substitution)
            })
            placeholders.value.push({ url: useUrl, name: substitution })
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

const nameOrTitle = (tab: Tab) => (tab.name ? tab.name : tab.title)

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''

const openTabset = (badge: any) => {
  console.log('clicked badge', badge)
  useTabsetService().selectTabset(badge.tabsetId)
  if (!inBexMode() || !chrome.sidePanel) {
    router.push('/tabsets/' + badge.tabsetId + '?highlight=' + badge.encodedUrl)
  } else {
    router.push('/sidepanel' + '?highlight=' + badge.encodedUrl)
  }
}

const openTabAssignmentPage = (tab: Tab) =>
  NavigationService.openOrCreateTab([chrome.runtime.getURL('/www/index.html#/mainpanel/tabAssignment/' + tab.id)])

const matcherTooltip = () => {
  const split = props.tab.matcher?.split('|')
  if (split && split.length > 1) {
    if (split[0] === 'sw') {
      // 'sw' = 'startsWith'
      return 'This tab will open in any tab with an URL starting with ' + split[1]
    }
  }
  return 'This tab will open in any tab which url matches ' + props.tab.matcher
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

const gotoTab = () => {
  if (props.tabset && props.tabset.monitoredTabs) {
    let found = false
    props.tabset.monitoredTabs.forEach((mt: MonitoredTab) => {
      if (mt.tabId === props.tab.id) {
        delete mt.changed
        found = true
      }
    })
    if (found) {
      useTabsetService().saveTabset(props.tabset)
    }
  }
  useCommandExecutor().executeFromUi(new OpenTabCommand(props.tab))
}

const showSuggestion = () => {
  const url = chrome.runtime.getURL('www/index.html') + '#/mainpanel/suggestions/' + suggestion.value?.id
  NavigationService.openOrCreateTab([url])
}

const openImage = () =>
  window.open(chrome.runtime.getURL('www/index.html#/mainpanel/png/' + props.tab.id + '/' + pngs.value[0]!.id))

const showComments = () =>
  showCommentList.value &&
  useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details) &&
  (props.tab as Tab).comments &&
  (props.tab as Tab).comments.length > 0

const toggleLists = (ident: string) => {
  switch (ident) {
    case 'annotations':
      showCommentList.value = false
      //showAnnotationList.value = !showAnnotationList.value
      break
    case 'comments':
      //showAnnotationList.value = false
      showCommentList.value = !showCommentList.value
      break
    default:
      console.log('undefined ident for toggle lists', ident)
      break
  }
}

const showInReadingMode = () =>
  useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${props.tab.id}`))

const togglePreview = () => {
  if (props.tab) {
    props.tab.preview =
      props.tab.preview === undefined || props.tab.preview === TabPreview.FAVICON
        ? TabPreview.THUMBNAIL
        : TabPreview.FAVICON
    useTabsetService().saveCurrentTabset()
  }
}

const showReadingMode = () => {
  if (props.tab) {
    //console.log("xxx", props.tab.id)
    const t: Tab = Object.assign(new Tab(props.tab.id, BrowserApi.createChromeTabObject('', '')), props.tab)
    return useFeaturesStore().hasFeature(FeatureIdent.READING_MODE) && t.hasTabReference(TabReferenceType.READING_MODE)
  }
  return false
}

function hasReference(tab: Tab, refType: TabReferenceType) {
  const t: Tab = Object.assign(new Tab(tab.id, BrowserApi.createChromeTabObject('', '')), tab)
  return t.hasTabReference(refType)
}

const showOpenSearchInput = () => {
  return props.tab ? hasReference(props.tab, TabReferenceType.OPEN_SEARCH) : false
}

const showRssReferencesInfo = () => {
  // prettier-ignore
  return props.tab
    ? hasReference(props.tab, TabReferenceType.RSS) && TabService.isCurrentTab(props.tab)
    : false
}

const openSearch = () => {
  console.log('openSearch clicked')
  try {
    const ref: object[] = props.tab!.tabReferences.filter((ref) => ref.type === TabReferenceType.OPEN_SEARCH)[0]!.data
    const parser = new DOMParser()
    const xml = ref[0]!['xml' as keyof object]
    console.log('using xml', xml)
    const doc = parser.parseFromString(xml, 'application/xml')
    let urlTag = doc.getElementsByTagName('Url')[0]
    if (!urlTag) {
      urlTag = doc.getElementsByTagName('url')[0]
    }
    const templateURL: string = urlTag!.getAttribute('template') || ''
    useNavigationService().browserTabFor(templateURL.replace('{searchTerms}', opensearchterm.value || ''))
  } catch (err: any) {
    handleError(err, NotificationType.NOTIFY)
  }
}

const openRssLink = (rss: TabReference) => useNavigationService().browserTabFor(rss.href!)

const ignore = (rss: TabReference) => {
  const tabReference = props.tab!.tabReferences.find((tr: TabReference) => tr.id === rss.id)
  if (tabReference && props.tabset) {
    tabReference.status = 'IGNORED'
    useTabsetService().saveTabset(props.tabset)
  }
}

const removeSessionTab = (tab: Tab) => {
  // const useTab = await tabToUse(props.tab)
  //let useTabset = props.tabset
  //if (!useTabset && props.tabsetId) {
  // useTabset = useTabsetsStore().getTabset(props.tabsetId)
  //}
  //if (useTabset) {
  useCommandExecutor().executeFromUi(new DeleteTabCommand(tab, props.tabset!))
  //}
}

const send = () => {
  if (sendComment.value.trim() !== '') {
    useCommandExecutor()
      .executeFromUi(new AddCommentCommand(props.tab.id, sendComment.value))
      .then(() => (sendComment.value = ''))
  }
}

const oldComments = () =>
  props.tab.comments.filter((c: TabComment) => newCommentIds.value.findIndex((id: string) => id === c.id) < 0)
const newComments = () =>
  props.tab.comments.filter((c: TabComment) => newCommentIds.value.findIndex((id: string) => id === c.id) >= 0)

const openReminderDialog = () =>
  $q.dialog({
    component: ReminderDialog,
    componentProps: { tabId: props.tab.id, date: props.tab.reminder, comment: props.tab?.reminderComment },
  })

const formatReadingTime = (ms: number) => {
  if (ms < 1000) {
    return ''
  } else if (ms < 60000) {
    return Math.round(ms / 1000) + 's.'
  } else if (ms < 60 * 60000) {
    return Math.round(ms / 60000) + 'm.'
  } else if (ms < 24 * 60 * 60000) {
    return Math.round((ms / 60) * 60000) + 'h.'
  } else {
    return ms
  }
}

const callRestApi = (tab: Tab) => {
  const restTab = tab as RestTab
  console.log(`about to call ${restTab.api} with ${JSON.stringify(restTab.params)}`)
  useNavigationService().browserTabFor(chrome.runtime.getURL('www/index.html/#/mainpanel/restapi/' + restTab.id))
}

const setCustomTitle = (tab: Tab, newValue: string) =>
  useCommandExecutor().executeFromUi(new UpdateTabNameCommand(tab, newValue))

const handleNameClick = useDblClickHandler(
  () => gotoTab(),
  () => {
    popupEdit.value = true
    nextTick().then(() => {
      if (popupRef?.value) {
        popupRef.value.show()
      }
    })
  },
)

// const handleNameClick = async (evt: MouseEvent) => {
//   console.log('evt: ', evt.detail, evt)
//   if (evt.detail === 2) {
//     popupEdit.value = true
//     nextTick().then(() => {
//       if (popupRef?.value) {
//         popupRef.value.show()
//       }
//     })
//   } else {
//     console.log('goto...')
//     gotoTab()
//   }
// }
</script>

<!--https://stackoverflow.com/questions/41078478/css-animated-checkmark -->
<style lang="scss" scoped>
.body--dark .darkColors {
  color: $grey-2;
}

.body--light .lightColors {
  color: $grey-9;
}

.q-item__section--main {
  margin-left: 2px;
}

.checkmark__circle {
  stroke-dasharray: 66;
  stroke-dashoffset: 66;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #8acb88;
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
  box-shadow: inset 0 0 0 #8acb88;
  animation:
    fill 0.4s ease-in-out 0.4s forwards,
    scale 0.3s ease-in-out 0.9s both;
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
  0%,
  100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0 0 0 30px #8acb88;
  }
}

// line with text in middle
// https://stackoverflow.com/questions/5214127/css-technique-for-a-horizontal-line-with-words-in-the-middle
h6 {
  overflow: hidden;
  text-align: center;
}

h6::before,
h6::after {
  background-color: #bfbfbf;
  content: '';
  display: inline-block;
  height: 1px;
  position: relative;
  vertical-align: middle;
  width: 50%;
}

h6::before {
  right: 0.5em;
  margin-left: -50%;
}

h6::after {
  left: 0.5em;
  margin-right: -50%;
}

// line with text in middle - end
</style>
