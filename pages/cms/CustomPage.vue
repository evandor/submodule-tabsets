<template>
  <q-header style="background-color: grey">
    <div class="row">
      <div class="col-12 text-right">
        <q-icon v-if="!props.edit" name="edit" size="xs" class="q-mx-md q-my-xs cursor-pointer" @click="editPage()" />
        <q-icon v-else name="edit_off" size="xs" class="q-mx-md q-my-xs cursor-pointer" @click="editOff()" />
      </div>
    </div>
  </q-header>
  <!--  <q-page padding class="home-page column justify-center items-center">-->
  <q-page style="max-width: 1200px; margin: 0 auto">
    <div class="row">
      <div class="col-2 q-pa-md q-mr-xl">
        <q-list>
          <q-item clickable v-ripple v-for="p in pageTabs">
            <q-item-section>{{ p.name || '?' }}</q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col q-mt-lg">
        <component-list :page="page" :editable="props.edit" @content-changed="savePage()"></component-list>
      </div>
      <div class="col-2"></div>
    </div>
  </q-page>
</template>
<script lang="ts" setup>
import ComponentList from 'src/tabsets/components/cms/ComponentList.vue'
import { Page } from 'src/tabsets/models/cms/backend'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{ edit: boolean }>()

const page = ref<Page | undefined>(undefined)
const pageTabs = ref<Tab[]>([])
const tabAndTabsetId = ref<TabAndTabsetId | undefined>(undefined)
const tabset = ref<Tabset | undefined>(undefined)

const route = useRoute()

const pageId = route.params.pageId as string

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  tabAndTabsetId.value = useTabsetsStore().getTabAndTabsetId(pageId)
  if (tabAndTabsetId.value) {
    page.value = tabAndTabsetId.value.tab.page
    tabset.value = useTabsetsStore().getTabset(tabAndTabsetId.value.tabsetId)

    pageTabs.value = useTabsetsStore().getPageTabs(tabset.value)
  }

  // if (usePagesStore().initialized) {
  //   usePagesStore()
  //     .loadPage(pageId)
  //     .then((p: Page) => {
  //       page.value = p
  //     })
  //   const currentTsId = await useTabsetsStore().getCurrentTabsetId()
  //   if (currentTsId) {
  //     pages.value = await usePagesStore().loadPages(currentTsId)
  //   }
  // }
})

const editOff = () => {
  const partsArray = window.location.href.split('/')
  partsArray.pop()
  window.location.href = partsArray.join('/')
}

const editPage = () => (window.location.href = window.location.href + '/edit')
const savePage = () => {
  if (page.value && tabAndTabsetId.value) {
    //usePagesStore().updatePage(page.value)
    if (tabset.value) {
      useTabsetsStore().saveTabset(tabset.value)
    }
  }
}
</script>
