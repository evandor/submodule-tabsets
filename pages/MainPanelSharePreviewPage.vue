<template>
  <div>hier</div>
</template>
<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";

const route = useRoute()

const tabsetId = ref<string | undefined>(undefined)

watchEffect(async () => {
  tabsetId.value = route.params.tabsetId as string
  console.log(`got tabsetId ${tabsetId.value}`)
})

</script>
