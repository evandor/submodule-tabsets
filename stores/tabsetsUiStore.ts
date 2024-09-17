import {defineStore} from 'pinia';
import {ref} from "vue";
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
