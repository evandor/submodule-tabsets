<template>
  <q-menu :offset="[0, 0]" @click.stop="">
    <q-list dense style="min-width: 200px">
      <PanelTabListContextMenuHook :tab="props.tab" :tabset="props.tabset!" />

      <template v-if="showTabDetailsMenuEntry(props['tab' as keyof object])">
        <q-item clickable v-close-popup @click.stop="showTabDetails(props['tab' as keyof object])">
          <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
            <q-icon size="xs" name="o_info" color="accent" />
          </q-item-section>
          <q-item-section> Tab Details (dev)</q-item-section>
        </q-item>
      </template>

      <q-separator inset />
      <q-item clickable v-close-popup @click.stop="editURL(props['tab' as keyof object])">
        <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
          <q-icon size="xs" name="o_edit" color="info" />
        </q-item-section>
        <q-item-section> Edit Tab</q-item-section>
      </q-item>

      <template
        v-if="
          useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE) &&
          props.tabset?.type.toString() !== TabsetType.DYNAMIC.toString()
        ">
        <q-item clickable v-close-popup @click.stop="addCommentDialog()">
          <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
            <q-icon size="xs" name="o_note" color="info" />
          </q-item-section>
          <q-item-section>Add Comment</q-item-section>
        </q-item>
      </template>

      <template v-if="useFeaturesStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT)">
        <q-separator inset />
        <q-item clickable v-close-popup @click.stop="assignTab(props['tab' as keyof object])">
          <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
            <q-icon size="xs" name="o_tab" color="info" />
          </q-item-section>
          <q-item-section> Tab Assignment</q-item-section>
        </q-item>
      </template>

      <template v-if="useFeaturesStore().hasFeature(FeatureIdent.COLOR_TAGS)">
        <q-separator inset />
        <q-item clickable v-close-popup @click.stop="setColor(props['tab' as keyof object])">
          <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
            <q-icon size="xs" name="o_colorize" color="blue" />
          </q-item-section>
          <q-item-section>
            <div class="row q-pa-xs q-mt-none q-pl-sm q-gutter-sm">
              <ColorSelector @colorSet="(color: string) => (theColor = color)" />
            </div>
          </q-item-section>
        </q-item>
      </template>

      <!--      <template v-if="useAuthStore().isAuthenticated">-->
      <!--        <q-separator inset/>-->
      <!--        <q-item clickable v-close-popup @click.stop="openSimilar()">-->
      <!--          <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">-->
      <!--            <q-icon size="xs" name="o_equal"/>-->
      <!--          </q-item-section>-->
      <!--          <q-item-section>-->
      <!--            Open similar websites-->
      <!--          </q-item-section>-->
      <!--        </q-item>-->
      <!--      </template>-->

      <q-item
        v-if="useFeaturesStore().hasFeature(FeatureIdent.REMINDER)"
        clickable
        v-close-popup
        @click.stop="openReminderDialog()">
        <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
          <q-icon size="xs" name="o_alarm" color="accent" />
        </q-item-section>
        <q-item-section> {{ props.tab.reminder ? 'Update' : 'Add' }} Reminder</q-item-section>
      </q-item>

      <q-separator inset />
      <q-item clickable v-close-popup @click.stop="deleteTab()">
        <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
          <q-icon size="xs" name="o_delete" color="negative" />
        </q-item-section>
        <q-item-section>
          {{ deleteTabLabel(props['tab' as keyof object]) }}
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import PanelTabListContextMenuHook from 'src/app/hooks/tabsets/PanelTabListContextMenuHook.vue'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import ColorSelector from 'src/core/dialog/ColorSelector.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { UpdateTabColorCommand } from 'src/tabsets/commands/UpdateTabColor'
import CommentDialog from 'src/tabsets/dialogues/CommentDialog.vue'
import EditUrlDialog from 'src/tabsets/dialogues/EditUrlDialog.vue'
import ReminderDialog from 'src/tabsets/dialogues/ReminderDialog.vue'
import { PlaceholdersType } from 'src/tabsets/models/Placeholders'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { PropType, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
  tabsetId: { type: String, required: false },
})

const emit = defineEmits(['toggleExpand'])

const $q = useQuasar()
const router = useRouter()

const theColor = ref<string | undefined>(undefined)

async function tabToUse(tab: Tab) {
  let useTab: Tab = tab
  if (tab.placeholders?.templateId) {
    const tabInfo = useTabsetsStore().getTabAndTabsetId(tab.placeholders?.templateId)
    if (tabInfo) {
      useTab = tabInfo.tab
      console.log('useTab', useTab, tab.placeholders?.templateId)
    }
  }
  return useTab
}

const deleteTab = async () => {
  const useTab = await tabToUse(props.tab)
  let useTabset = props.tabset
  if (!useTabset && props.tabsetId) {
    useTabset = useTabsetsStore().getTabset(props.tabsetId)
  }
  if (useTabset) {
    useCommandExecutor().executeFromUi(new DeleteTabCommand(useTab, useTabset))
  }
}

const showTabDetails = async (tab: Tab) => {
  const useTab: Tab = await tabToUse(tab)
  console.log('showing tab details for', useTab)
  router.push('/sidepanel/tab/' + useTab.id)
}

const showTabDetailsMenuEntry = (tab: Tab) => useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)
//&& !(tab.placeholders?.type === PlaceholdersType.URL_SUBSTITUTION)

const deleteTabLabel = (tab: Tab) =>
  tab.placeholders && tab.placeholders.type === PlaceholdersType.URL_SUBSTITUTION ? 'Delete all' : 'Delete Tab'

const editURL = async (tab: Tab) => {
  let useTab = await tabToUse(tab)
  $q.dialog({
    component: EditUrlDialog,
    componentProps: {
      tab: useTab,
    },
  })
}

const assignTab = async (tab: Tab) =>
  await NavigationService.openOrCreateTab([chrome.runtime.getURL('/www/index.html#/mainpanel/tabAssignment/' + tab.id)])

const setColor = (tab: Tab) => useCommandExecutor().execute(new UpdateTabColorCommand(tab, theColor.value))

const addCommentDialog = () =>
  $q.dialog({
    component: CommentDialog,
    componentProps: { tabId: props.tab.id, sharedId: props.tabset?.sharing?.sharedId },
  })

const openReminderDialog = () =>
  $q.dialog({
    component: ReminderDialog,
    componentProps: { tabId: props.tab.id, date: props.tab.reminder, comment: props.tab?.reminderComment },
  })
</script>
