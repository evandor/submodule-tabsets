<template>
  <!-- PanelTabListElementWidget2 -->
  <div class="q-pa-none fit" style="width: 100%">
    <div class="row" style="border: 0 solid blue; width: 100%">
      <div class="col-1 q-ml-sm q-mt-xs">
        <TabListIconItem2 :tabset="props.tabset!" :tab="tab" :detail-level="props.detailLevel" />
      </div>
      <div class="col q-ml-sm ellipsis">
        <div class="row fit">
          <div class="col q-mr-xs" style="border: 0 solid red">
            <TabListMainItem2
              :header="props.header"
              :tabset="props.tabset"
              :filter="props.filter || undefined"
              :tab="tab"
              :showCommentsForMinimalDetails="showCommentList"
              :detail-level="props.detailLevel" />
          </div>
          <div class="text-right" style="border: 0 solid green">
            <slot name="actionPart">
              <q-icon
                v-if="showReadingMode()"
                name="o_menu_book"
                size="16px"
                class="q-ma-none q-pa-none"
                color="primary"
                @click.stop="showInReadingMode()">
                <q-tooltip class="tooltip-small">Click here to open in Reading Mode</q-tooltip>
              </q-icon>

              <q-icon
                v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 0"
                name="o_chat"
                size="16px"
                color="primary"
                style="position: relative; top: 1px"
                class="q-ma-none q-pa-none q-ml-xs"
                @click.stop="toggleShowWith('comments')">
                <q-tooltip class="tooltip-small">There are comments for this tab</q-tooltip>
              </q-icon>

              <q-icon
                v-if="props.tab.pinnedInList && useUiStore().folderStyle === 'goInto'"
                name="sym_o_keep"
                size="16px"
                class="q-ma-none q-pa-none"
                style="cursor: default"
                color="primary">
                <q-tooltip class="tooltip-small">This tab is pinned, i.e. it appears in all subfolders</q-tooltip>
              </q-icon>
              <TabListActionsItem :tabset="props.tabset!" :tab="tab" :detail-level="props.detailLevel" />
            </slot>
          </div>
        </div>
      </div>
    </div>

    <div
      class="row fit"
      v-if="showWithMinDetails('SOME') || props.tab?.details !== 'DEFAULT'"
      style="border: 0 solid brown">
      <div class="col-1 q-ml-sm q-mt-xs">
        <div
          v-if="props.tab?.httpInfo === 'UPDATED'"
          class="q-my-xs q-mx-none q-pa-none text-white bg-positive items-center justify-center"
          style="border-radius: 3px; max-height: 15px; font-size: 8px; text-align: center">
          NEW
          <q-tooltip class="tooltip">This page indicates that its content has changed in the meantime.</q-tooltip>
        </div>
        <div
          v-else-if="(props.tab?.httpStatus >= 300 || props.tab?.httpStatus === 0) && !props.tab?.placeholders"
          class="q-my-xs q-mx-sm q-pa-none text-white items-center justify-center column"
          :class="props.tab?.httpStatus >= 500 ? 'bg-red' : 'bg-warning'"
          style="border-radius: 3px; max-height: 15px; font-size: 8px; text-align: center">
          {{ props.tab.httpStatus }}
          <q-tooltip class="tooltip">Tabsets has problems accessing this site.</q-tooltip>
        </div>
        <!--        <div v-if="props.tab.reminder || monitor" class="text-center">-->
        <!--          <q-icon v-if="props.tab.reminder" name="o_alarm" @click="openReminderDialog()" size="14px">-->
        <!--            <q-tooltip class="tooltip-small"-->
        <!--            >Reminder set to {{ date.formatDate(props.tab.reminder, 'DD.MM.YYYY') }}-->
        <!--              {{ props.tab.reminderComment ? ' - ' : '' }} {{ props.tab.reminderComment }}-->
        <!--            </q-tooltip>-->
        <!--          </q-icon>-->
        <!--          <q-icon-->
        <!--            v-if="monitor"-->
        <!--            :name="monitor.changed ? 'o_notifications_active' : 'o_notifications'"-->
        <!--            :color="monitor.changed ? 'negative' : ''"-->
        <!--            size="14px">-->
        <!--            <q-tooltip v-if="monitor.changed" class="tooltip-small"-->
        <!--            >Tab's content has changed at {{ date.formatDate(monitor.changed, 'DD.MM.YYYY') }}-->
        <!--            </q-tooltip>-->
        <!--            <q-tooltip v-else class="tooltip-small">Tab is being monitored for content changes</q-tooltip>-->
        <!--          </q-icon>-->
        <!--        </div>-->
      </div>
      <div class="col fit q-ml-sm">
        <div class="columns">
          <div
            class="col text-body2 q-mr-md q-my-xs"
            @click.stop="gotoTab()"
            :class="uiDensity === 'dense' ? 'ellipsis-2-lines ' : 'ellipsis-3-lines'">
            <Highlight :filter="props.filter" :text="props.tab.longDescription || props.tab.description || ''" />
          </div>
          <div class="col text-caption">
            <template v-if="props.tab.extension !== UrlExtension.RSS && props.tab.url">
              <short-url
                @click.stop="gotoTab()"
                :url="props.tab.url"
                :hostname-only="!useUiStore().showFullUrls"
                :filter="props.filter || ''" />
              <!--              <q-icon-->
              <!--                v-if="props.tab.matcher && useFeaturesStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT)"-->
              <!--                @click.stop="openTabAssignmentPage(props.tab)"-->
              <!--                name="o_settings">-->
              <!--                <q-tooltip class="tooltip">{{ matcherTooltip() }}</q-tooltip>-->
              <!--              </q-icon>-->
              <!-- <q-icon class="q-ml-xs" name="open_in_new"/>-->
              <!--              <ul v-if="placeholders.length > 0">-->
              <!--                <div v-for="placeholder in placeholders">-->
              <!--                  <li>-->
              <!--                    <short-url-->
              <!--                      @click.stop="-->
              <!--                    NavigationService.openOrCreateTab(-->
              <!--                      [placeholder['url' as keyof object]],-->
              <!--                      props.tab.matcher,-->
              <!--                      props.tab.groupName ? [props.tab.groupName] : [],-->
              <!--                    )-->
              <!--                  "-->
              <!--                      :label="placeholder['name' as keyof object]"-->
              <!--                      :url="placeholder['url' as keyof object]"-->
              <!--                      :hostname-only="true"-->
              <!--                      :filter="props.filter" />-->
              <!--                  </li>-->
              <!--                </div>-->
              <!--              </ul>-->
            </template>
          </div>

          <!--          <div class="col ellipsis">*** dfjkdf kldsjf kldsjf dksjfdsklf dsjkljdsfkldsjfdklsfjdslf</div>-->
        </div>
        <!--        <div class="column fit">-->
        <!--          <div class="col ellipsis" style="border: 1px solid red">-->
        <!--            &lt;!&ndash; === description === &ndash;&gt;-->
        <!--            &lt;!&ndash;                :class="props.tab?.extension === UrlExtension.RSS ? 'ellipsis-3-lines' : 'ellipsis-2-lines'"&ndash;&gt;-->
        <!--          </div>-->
        <!--        </div>-->
      </div>
    </div>
    <div
      class="row fit"
      v-if="showWithMinDetails('MAXIMAL') || props.tab?.details === 'MAXIMAL'"
      style="border: 0 solid red">
      <div class="col-1 q-ml-sm q-mt-xs"></div>
      <div class="col fit q-ml-sm" @click="gotoTab()">
        <!-- === open search === -->
        <div class="q-pr-lg q-mt-none q-pt-none cursor-pointer">
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
        </div>

        <!-- === last active, reading time & icons === -->
        <div class="q-pr-xs q-mt-none q-pt-none cursor-pointer">
          <div class="row">
            <div class="col-9">
              <div class="text-caption text-grey-5 ellipsis">
                <q-icon
                  v-if="(props.tab as Tab).placeholders"
                  size="xs"
                  name="published_with_changes"
                  class="q-mr-xs"
                  color="accent">
                  <q-tooltip class="tooltip-small">This tab is created by substituting parts of its URL</q-tooltip>
                </q-icon>

                <!--            <q-btn-->
                <!--              v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 0"-->
                <!--              @click.stop="toggleLists('comments')"-->
                <!--              class="q-mr-xs q-mt-xs"-->
                <!--              color="warning"-->
                <!--              dense-->
                <!--              round-->
                <!--              flat-->
                <!--              icon="o_chat">-->
                <!--              <q-tooltip class="tooltip-small"-->
                <!--                >This tab has {{ newCommentIds.length > 0 ? 'new' : '' }} comments-->
                <!--              </q-tooltip>-->
                <!--              <q-badge v-if="newCommentIds.length > 0" color="accent" rounded floating transparent>-->
                <!--                {{ newCommentIds.length }}-->
                <!--              </q-badge>-->
                <!--            </q-btn>-->

                <span
                  v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 1"
                  @click.stop="toggleLists('comments')"
                  class="q-mr-sm q-ml-none"
                  >({{ (props.tab as Tab).comments.length }})</span
                >

                <span>
                  <TabListIconIndicatorsHook :tabId="props.tab.id" :tabUrl="props.tab.url" />
                  <span v-if="props.tab.extension !== UrlExtension.RSS && showWithMinDetails('MAXIMAL')"
                    >last active: {{ formatDate(props.tab.lastActive) }}</span
                  >
                  <span v-else-if="props.tab.extension === UrlExtension.RSS"
                    >published: {{ formatDate(props.tab.created) }}</span
                  >
                </span>
              </div>
            </div>
            <div class="col text-caption text-right">
              <span v-if="tab.readingTime > 0 && showWithMinDetails('SOME')" class="text-grey-5">
                {{ formatReadingTime(tab.readingTime) }}
                <q-tooltip class="tooltip-small">cumulated reading time</q-tooltip>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistance } from 'date-fns'
import BrowserApi from 'src/app/BrowserApi'
import TabListIconIndicatorsHook from 'src/app/hooks/tabsets/TabListIconIndicatorsHook.vue'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { TabReferenceType } from 'src/content/models/TabReference'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import ShortUrl from 'src/core/utils/ShortUrl.vue'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { OpenTabCommand } from 'src/tabsets/commands/OpenTabCommand'
import { Tab, UrlExtension } from 'src/tabsets/models/Tab'
import { MonitoredTab, Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import Highlight from 'src/tabsets/widgets/Highlight.vue'
import TabListActionsItem from 'src/tabsets/widgets/tabListItems/TabListActionsItem.vue'
import TabListIconItem2 from 'src/tabsets/widgets/tabListItems/TabListIconItem2.vue'
import TabListMainItem2 from 'src/tabsets/widgets/tabListItems/TabListMainItem2.vue'
import { ListDetailLevel, useUiStore } from 'src/ui/stores/uiStore'
import { inject, PropType, ref, watchEffect } from 'vue'

const { handleError } = useNotificationHandler()
const { formatReadingTime } = useUtils()

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
  header: { type: String, required: false },
  filter: { type: String, required: false },
  detailLevel: { type: String as PropType<ListDetailLevel>, required: false },
})

const uiDensity = inject('ui.density')

const suggestion = ref<Suggestion | undefined>(undefined)
const doShowDetails = ref(false)
const showCommentList = ref(false)
const showPlaceholderList = ref(false)
const opensearchterm = ref<string | undefined>(undefined)

watchEffect(() => {
  if (props.tab.url) {
    suggestion.value = useSuggestionsStore().getSuggestionForUrl(props.tab.url)
  }
})

const showInReadingMode = () =>
  useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${props.tab.id}`))

const showReadingMode = () => {
  if (props.tab) {
    const t: Tab = Object.assign(new Tab(props.tab.id, BrowserApi.createChromeTabObject('', '')), props.tab)
    return useFeaturesStore().hasFeature(FeatureIdent.READING_MODE) && t.hasTabReference(TabReferenceType.READING_MODE)
  }
  return false
}

const toggleLists = (ident: string) => {
  switch (ident) {
    case 'annotations':
      showCommentList.value = false
      break
    case 'comments':
      showCommentList.value = !showCommentList.value
      console.log('showCommentList set to', showCommentList.value)
      break
    case 'placeholder':
      showPlaceholderList.value = !showPlaceholderList.value
      break
    default:
      console.log('undefined ident for toggle lists', ident)
      break
  }
}

const toggleShowWith = (ident: string | undefined) => {
  doShowDetails.value = !doShowDetails.value
  if (ident) {
    toggleLists(ident)
  }
}

const showWithMinDetails = (level: ListDetailLevel) => /*doShowDetails.value ||*/ showDetailsForThreshold(level)

const showDetailsForThreshold = (level: ListDetailLevel) =>
  useUiStore().listDetailLevelGreaterEqual(level, props.tabset?.details, props.detailLevel)

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

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''

function hasReference(tab: Tab, refType: TabReferenceType) {
  const t: Tab = Object.assign(new Tab(tab.id, BrowserApi.createChromeTabObject('', '')), tab)
  return t.hasTabReference(refType)
}

const showOpenSearchInput = () => {
  return props.tab ? hasReference(props.tab, TabReferenceType.OPEN_SEARCH) : false
}

const openSearch = () => {
  console.log('openSearch clicked')
  try {
    const ref: object[] = props.tab.tabReferences.filter((ref) => ref.type === TabReferenceType.OPEN_SEARCH)[0]!.data
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
</script>

<style lang="scss" src="src/tabsets/widgets/css/panelTabListElementWidget.scss" />
