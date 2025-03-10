<template>
  <template v-if="useFeaturesStore().hasFeature(FeatureIdent.TABSETS_SHARING)">
    <q-separator inset />
    <ContextMenuItem icon="open_in_new" label="Sharing..." color="primary">
      <q-item-section side>
        <q-icon name="keyboard_arrow_right" />
      </q-item-section>
      <q-menu anchor="top end" self="top start">
        <q-list>
          <q-item
            v-if="tabset.sharing.sharing === TabsetSharing.UNSHARED || !tabset.sharing"
            color="warning"
            dense
            clickable
            v-close-popup
            @click="shareTabsetPubliclyDialog(tabset)">
            <q-item-section>Publish publicly...</q-item-section>
            <q-tooltip class="tooltip-small">Publish this tabset</q-tooltip>
          </q-item>
          <q-item
            v-if="tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED"
            color="warning"
            dense
            clickable
            v-close-popup
            @click="shareTabsetPubliclyDialog(tabset, true)">
            <q-item-section>Republish</q-item-section>
            <q-tooltip class="tooltip-small">Tabset has changed, republish</q-tooltip>
          </q-item>
          <q-item
            v-if="
              tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK ||
              tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED
            "
            color="warning"
            dense
            clickable
            v-close-popup
            @click="copyPublicShareToClipboard(tabset.id)">
            <q-item-section>Copy Share URL</q-item-section>
            <q-tooltip class="tooltip-small">Copy the link to the shared tabset</q-tooltip>
          </q-item>
          <q-item
            v-if="
              tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK ||
              tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED
            "
            color="warning"
            dense
            clickable
            v-close-popup
            @click="openPublicShare(tabset.id)">
            <q-item-section>Open Shared Page</q-item-section>
            <q-tooltip class="tooltip-small">Open the shared location</q-tooltip>
          </q-item>
          <q-item color="warning" dense clickable v-close-popup @click="openShareWithDialog(tabset)">
            <q-item-section>Share with...</q-item-section>
            <q-tooltip class="tooltip-small">Share with User or Team</q-tooltip>
          </q-item>
          <q-item
            v-if="
              tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK ||
              tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED
            "
            color="warning"
            dense
            clickable
            v-close-popup
            @click="removePublicShare(tabset.id, tabset.sharing?.sharedId || '')">
            <q-item-section>Stop Sharing</q-item-section>
            <q-tooltip class="tooltip-small">Delete Shared Link</q-tooltip>
          </q-item>
        </q-list>
      </q-menu>
    </ContextMenuItem>
  </template>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { CopyToClipboardCommand } from 'src/core/domain/commands/CopyToClipboard'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { UnShareTabsetCommand } from 'src/tabsets/commands/UnShareTabsetCommand'
import ShareTabsetDialog from 'src/tabsets/dialogues/ShareTabsetDialog.vue'
import ShareTabsetPubliclyDialog from 'src/tabsets/dialogues/ShareTabsetPubliclyDialog.vue'
import { Tabset, TabsetSharing } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const props = defineProps<ActionProps>()

const { inBexMode } = useUtils()

const $q = useQuasar()

const openShareWithDialog = (tabset: Tabset, republish: boolean = false) => {
  $q.dialog({
    component: ShareTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      sharedId: tabset.sharing?.sharedId,
      tabsetName: tabset.name,
      republish: republish,
    },
  })
}

const openPublicShare = (tabsetId: string) => {
  const ts = useTabsetsStore().getTabset(tabsetId)
  if (ts && ts.sharing?.sharedId) {
    //openURL(getPublicTabsetLink(ts))
  }
}

const getPublicTabsetLink = (ts: Tabset) => {
  // https://shared.tabsets.net/#/pwa/imp/2f0f2171-27a6-4d03-a2dd-157ab6ef42ae?n=TXVzaWM=&a=Q2Fyc3Rlbg==
  // http://localhost:9200/#/pwa/imp/2f0f2171-27a6-4d03-a2dd-157ab6ef42ae?n=TXVzaWM=&a=Q2Fyc3Rlbg==
  let image = 'https://tabsets.web.app/favicon.ico'
  if (ts && ts.sharing?.sharedId) {
    //return PUBLIC_SHARE_URL + "#/pwa/imp/" + ts.sharing?.sharedId + "?n=" + btoa(ts.name) + "&a=" + btoa(ts.sharing?.sharedBy || 'n/a') + "&d=" + ts.sharedAt
    return (
      // 'https://us-central1-tabsets-backend-prd.cloudfunctions.net/app/share/preview/' +
      process.env.PWA_BACKEND_URL +
      '/#/pwa/imp/' +
      ts.sharing?.sharedId +
      '?n=' +
      btoa(ts.name) +
      '&a=' +
      btoa(ts.sharing?.sharedBy || 'n/a')
    )
  }
  return image
}

const shareTabsetPubliclyDialog = (tabset: Tabset, republish: boolean = false) => {
  $q.dialog({
    component: ShareTabsetPubliclyDialog,
    componentProps: {
      tabsetId: tabset.id,
      sharedId: tabset.sharing?.sharedId,
      tabsetName: tabset.name,
      republish: republish,
    },
  })
}
const copyPublicShareToClipboard = (tabsetId: string) => {
  const ts = useTabsetsStore().getTabset(tabsetId)
  if (ts && ts.sharing?.sharedId) {
    useCommandExecutor().executeFromUi(new CopyToClipboardCommand(getPublicTabsetLink(ts)))
  }
}

const removePublicShare = (tabsetId: string, sharedId: string) =>
  useCommandExecutor().executeFromUi(new UnShareTabsetCommand(tabsetId, sharedId))
</script>
