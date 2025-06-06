<template>
  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-5">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1">
              <span class="text-dark">Domain</span>
              <span class="text-primary">
                {{ domain }}
              </span>
            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right"></div>
    </div>
  </q-toolbar>

  <!-- rest: neither pinned, grouped, or pending -->
  <q-expansion-item icon="tabs" default-opened data-testid="expansion_item_unpinnedNoGroup" expand-separator>
    <template v-slot:header>
      <q-item-section>
        <div>
          <span class="text-weight-bold">Tabs</span>
          <div class="text-caption ellipsis"></div>
        </div>
      </q-item-section>
    </template>

    <q-card>
      <q-card-section>
        <!--        <TabList :tabs="groupedTabs" group="groupedTabs" />-->
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import _ from 'lodash'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const domain = ref(null as unknown as string)

onMounted(() => {
  Analytics.firePageViewEvent('ByDomainPage', document.location.href)
})

watchEffect(() => {
  domain.value = route.params.encodedUrl as string
  if (domain.value) {
    domain.value = atob(domain.value)
  }
})

const groupedTabs = ref<Tab[]>([])

watchEffect(() => {
  console.log('checkin tabs2....')
  const allTabs: Tab[] = _.orderBy(
    _.filter(
      _.flatMap(
        _.filter(
          _.map([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => ts),
          (ts: Tabset) => ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE,
        ),
        (ts: Tabset) => ts.tabs,
      ),
      (t: Tab) => true,
    ),
    (t: Tab) => t.activatedCount,
    ['desc'],
  )
  groupedTabs.value = _.filter(allTabs, (t: Tab) => {
    if (t.url) {
      try {
        const hostname = new URL(t.url).hostname
        const splits = hostname.split('.')
        switch (splits.length) {
          case 3:
            return hostname.substring(1 + hostname.indexOf('.')) === domain.value
          default:
            return hostname === domain.value
        }
      } catch (e) {
        return false
      }
    } else {
      return false
    }
  })
})
</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey
</style>
