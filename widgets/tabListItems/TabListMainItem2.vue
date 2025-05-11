<template>
  <!-- === name or title === -->
  <div class="row">
    <div class="q-pr-none q-mr-xs cursor-pointer ellipsis fit q-mt-xs">
      <span v-if="props.tab?.extension === UrlExtension.NOTE" v-html="nameOrTitle(props.tab as Tab)" />
      <span v-else :class="TabService.isCurrentTab(props.tab) ? 'text-bold' : ''" @click.stop="handleNameClick">
        <q-icon
          v-if="props.tab?.favorite && props.tab?.favorite !== TabFavorite.NONE"
          :color="props.tab.favorite === TabFavorite.TABSET ? 'warning' : 'positive'"
          name="star"
          class="q-ma-mone">
          <q-tooltip class="tooltip_small">This tab is marked as favorite</q-tooltip>
        </q-icon>
        <!-- small icons in minimal view -->
        <template v-if="showDetailsForThreshold('MINIMAL')">
          <span v-if="(props.tab as Tab).placeholders">
            <q-icon
              name="sym_o_dynamic_feed"
              size="12px"
              style="position: relative; top: -4px"
              class="q-mr-xs"
              @click.stop="toggleShowWith('placeholder')">
              <q-tooltip class="tooltip-small">There are placeholders defined for this tab</q-tooltip>
            </q-icon>
          </span>
        </template>

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
      <div v-if="props.header" class="text-caption">{{ props.header }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { STRIP_CHARS_IN_USER_INPUT } from 'boot/constants'
import { formatDistance } from 'date-fns'
import { QPopupEdit, uid, useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import { useEventsServices } from 'src/events/services/EventsServices'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { RestTab } from 'src/rest/models/RestTab'
import NavigationService from 'src/services/NavigationService'
import TabService from 'src/services/TabService'
import { SavedBlob } from 'src/snapshots/models/SavedBlob'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { AddCommentCommand } from 'src/tabsets/commands/AddCommentCommand'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import { OpenTabCommand } from 'src/tabsets/commands/OpenTabCommand'
import { UpdateTabNameCommand } from 'src/tabsets/commands/UpdateTabName'
import AddRssFeedDialog from 'src/tabsets/dialogues/actions/AddRssFeedDialog.vue'
import { PlaceholdersType } from 'src/tabsets/models/Placeholders'
import { Tab, TabComment, TabFavorite, UrlExtension } from 'src/tabsets/models/Tab'
import { MonitoredTab, Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import Highlight from 'src/tabsets/widgets/Highlight.vue'
import { ListDetailLevel, useUiStore } from 'src/ui/stores/uiStore'
import { nextTick, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { handleError } = useNotificationHandler()
const { useDblClickHandler, inBexMode } = useUtils()

const $q = useQuasar()
const router = useRouter()

const props = defineProps<{
  tabset: Tabset | undefined
  tab: Tab
  detailLevel: ListDetailLevel | undefined
  hideMenu?: boolean
  header?: string | undefined
  filter?: string | undefined
  showTabsets?: string
  showCommentsForMinimalDetails?: boolean | undefined
}>()

const showButtonsProp = ref<boolean>(false)
const tsBadges = ref<object[]>([])
const showCommentList = ref(false)
const showPlaceholderList = ref(false)
const placeholders = ref<Object[]>([])
const suggestion = ref<Suggestion | undefined>(undefined)
const pngs = ref<SavedBlob[]>([])
const opensearchterm = ref<string | undefined>(undefined)
const sendComment = ref<string>('')
const newCommentIds = ref<string[]>([])
const monitor = ref<MonitoredTab | undefined>(undefined)
const popupEdit = ref(false)
const popupRef = ref<any>(undefined)
const doShowDetails = ref(false)
const rssTabReferences = ref<TabReference[]>(
  props.tab?.tabReferences?.filter((r: TabReference) => r.type === TabReferenceType.RSS && r.status !== 'IGNORED'),
)

onMounted(() => {
  if (props.tabset?.id) {
    newCommentIds.value = useEventsServices().listNewComments(props.tabset.id, props.tab)
  }
  monitor.value =
    props.tabset &&
    props.tabset.monitoredTabs &&
    props.tabset.monitoredTabs.find((mt: MonitoredTab) => mt.tabId === props.tab.id)
})

watchEffect(() => {
  if (props.tab && props.tab.url) {
    // cnt.value = cnt.value + 1
    const url = props.tab.url
    const tabsetIds = useTabsetService().tabsetsFor(url)
    tsBadges.value = []
    tabsetIds.forEach((tsId: string) => {
      tsBadges.value.push({
        label: useTabsetService().nameForTabsetId(tsId),
        tabsetId: tsId,
        encodedUrl: btoa(url || ''),
      })
    })
  }
})

watchEffect(() => {
  // console.log('hierA')
  if (props.tab) {
    const t = props.tab
    //console.log("placeholders", t.placeholders)
    if (t.placeholders && t.placeholders.type === PlaceholdersType.URL_SUBSTITUTION) {
      const subs = t.placeholders.config
      Object.entries(subs).forEach((e) => {
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

const showWithMinDetails = (level: ListDetailLevel) => /*doShowDetails.value ||*/ showDetailsForThreshold(level)

const showDetailsForThreshold = (level: ListDetailLevel) =>
  useUiStore().listDetailLevelGreaterEqual(level, props.tabset?.details, props.detailLevel)

const nameOrTitle = (tab: Tab) => (tab.name ? tab.name : tab.title)

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

const callRestApi = (tab: Tab) => {
  const restTab = tab as RestTab
  console.log(`about to call ${restTab.api} with ${JSON.stringify(restTab.params)}`)
  useNavigationService().browserTabFor(chrome.runtime.getURL('www/index.html/#/mainpanel/restapi/' + restTab.id))
}

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
const showReadingMode = () => {
  if (props.tab) {
    //console.log("xxx", props.tab.id)
    const t: Tab = Object.assign(new Tab(props.tab.id, BrowserApi.createChromeTabObject('', '')), props.tab)
    return useFeaturesStore().hasFeature(FeatureIdent.READING_MODE) && t.hasTabReference(TabReferenceType.READING_MODE)
  }
  return false
}

const showRssReferencesInfo = () => {
  // prettier-ignore
  return props.tab
    ? hasReference(props.tab, TabReferenceType.RSS) && TabService.isCurrentTab(props.tab)
    : false
}

const openRssDialog = (rss: TabReference) => {
  console.log('openRssDialog', rss)
  $q.dialog({
    component: AddRssFeedDialog,
    componentProps: { rssTabReference: rss },
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
  }).onOk(async (data: any) => {
    console.log('hier', data)
    const ts = useTabsetsStore().getCurrentTabset
    if (ts) {
      await useCommandExecutor().executeFromUi(
        new CreateFolderCommand(
          uid(),
          data['feedName' as keyof object].replace(STRIP_CHARS_IN_USER_INPUT, ''),
          [],
          ts.id,
          undefined,
          data['rssUrl' as keyof object],
          TabsetType.RSS_FOLDER,
        ),
      )
    }
  })
}

const openRssLink = (rss: TabReference) => {
  let useUrl = rss.href!
  if (useUrl.startsWith('/')) {
    try {
      const url = new URL(props.tab.url!)
      useUrl = url.protocol + '//' + url.hostname + rss.href!
    } catch (err) {}
  }
  //console.log('useUrl', useUrl)
  useNavigationService().browserTabFor(useUrl)
}

const ignore = (rss: TabReference) => {
  const tabReference = props.tab.tabReferences.find((tr: TabReference) => tr.id === rss.id)
  if (tabReference && props.tabset) {
    tabReference.status = 'IGNORED'
    useTabsetService().saveTabset(props.tabset)
  }
}

const hideAll = () => rssTabReferences.value.forEach((r: TabReference) => ignore(r))

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

const showComments = () => props.showCommentsForMinimalDetails && props.tab.comments.length > 0

const showInReadingMode = () =>
  useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${props.tab.id}`))

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

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''

const openTabset = (badge: any) => {
  console.log('clicked badge', badge)
  useTabsetService().selectTabset(badge.tabsetId)
  if (!inBexMode() || !chrome.sidePanel) {
    router.push('/sidepanel/tabsets/' + badge.tabsetId + '?highlight=' + badge.encodedUrl)
  } else {
    router.push('/sidepanel' + '?highlight=' + badge.encodedUrl)
  }
}
</script>
