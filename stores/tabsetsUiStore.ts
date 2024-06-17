import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import _ from "lodash"
import {LocalStorage} from "quasar";
import {useUtils} from "src/core/services/Utils";
import {Toast, ToastType} from "src/core/models/Toast";
import {
  SHARING_AUTHOR_IDENT,
  SHARING_AVATAR_IDENT,
} from "boot/constants";
import {SidePanelViews} from "src/models/SidePanelViews";
import {SidePanel} from "src/models/SidePanel";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {TabAndTabsetId} from "src/tabsets/models/TabAndTabsetId";


export const useTabsetsUiStore = defineStore('tabsetsUi', () => {

  const matchingTabs = ref<TabAndTabsetId[]>([])

  function setMatchingTabsFor(url: string) {
    const tabAndTabsetIds = useTabsetsStore().tabsForUrl(url)
    matchingTabs.value = tabAndTabsetIds
    console.log("matchingTabs", matchingTabs.value)
  }



  return {
    setMatchingTabsFor,
    matchingTabs
  }
})
