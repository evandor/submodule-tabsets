<template>
  <!-- SidePanelRemindersListViewer -->
  <div class="q-pa-none">
    <q-list class="rounded-borders">
      <q-expansion-item
        v-for="reminderDate in Object.keys(groupedTabs as object)"
        expand-separator
        default-opened
        :label="date.formatDate(Number(reminderDate), 'DD.MM.YYYY')"
        caption="Reminders">
        <q-card>
          <q-card-section>
            <div v-for="tab in (groupedTabs as object)[reminderDate as keyof object] as Tab[]">
              <q-item
                clickable
                v-ripple
                class="q-mt-xs q-mx-xs q-mb-none q-pr-none q-pl-sm q-pb-none q-pt-none darkColors lightColors"
                :key="'paneltablist_' + tab.id">
                <PanelTabListElementWidget :tab="tab" :hide-menu="true">
                  <template v-slot:actionPart> *** </template>
                </PanelTabListElementWidget>
              </q-item>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { date } from 'quasar'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import PanelTabListElementWidget from 'src/tabsets/widgets/PanelTabListElementWidget.vue'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'

const tabsetsSessions = ref<Tabset[]>([])
const userCanSelect = ref(false)

const groupedTabs = ref<_.Dictionary<Tab[]> | undefined>(undefined)

onMounted(async () => {
  Analytics.firePageViewEvent('SidePanelRemindersListViewer', document.location.href)

  groupedTabs.value = _.groupBy(useTabsetsStore().reminderTabset.tabs, (t: Tab) => t.reminder)
})

watchEffect(() => {
  userCanSelect.value = false
})

const openSession = (session: Tabset) => {
  useTabsetService().selectTabset(session.id)
  useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
}
</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0
</style>
