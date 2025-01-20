<template>
  <!-- SidePanelOpenTabsPage -->
  <q-page padding style="padding-top: 34px">
    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-md">
            <SidePanelSessionsListViewer />
          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Browser Sessions">
        <template v-slot:iconsRight>
          <div class="q-mt-sm q-ma-none q-qa-none">
            <q-btn outline size="xs" label="new session" class="q-mr-md" @click.stop="startSession()" />
          </div>
        </template>
      </ViewToolbarHelper>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import ViewToolbarHelper from 'pages/sidepanel/helper/ViewToolbarHelper.vue'
import { useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import Analytics from 'src/core/utils/google-analytics'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { RestoreTabsetCommand } from 'src/tabsets/commands/RestoreTabset'
import StartSessionDialog from 'src/tabsets/dialogues/StartSessionDialog.vue'
import { SaveOrReplaceResult } from 'src/tabsets/models/SaveOrReplaceResult'
import { TabsetType } from 'src/tabsets/models/Tabset'
import SidePanelSessionsListViewer from 'src/tabsets/pages/SidePanelSessionsListViewer.vue'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { onMounted } from 'vue'

const $q = useQuasar()

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelSessionsPage', document.location.href)
})

const startSession = () => {
  $q.dialog({
    component: StartSessionDialog,
  }).onOk((callback: { oldSessionName: string; collection: string }) => {
    console.log('callback', callback)
    const tabsToUse = useTabsStore2().browserTabs
    useCommandExecutor()
      .execute(new CreateTabsetCommand(callback.oldSessionName, tabsToUse))
      .then((res: ExecutionResult<SaveOrReplaceResult>) => {
        console.log('res', res.result.tabset)
        const ts = res.result.tabset
        ts.type = TabsetType.SESSION
        useTabsetsStore().saveTabset(ts)
        BrowserApi.closeAllTabs(false)
      })
      .then(() => {
        const tabsetId = callback.collection['value' as keyof object]
        //useCommandExecutor().executeFromUi(new CreateTabsetCommand(callback['sessionName' as keyof object], []))
        if (tabsetId) {
          useTabsetService().selectTabset(tabsetId)
          useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, undefined, false))
        }
      })
  })
}
</script>
