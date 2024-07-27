<template>
  <div>hier</div>
</template>
<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";

import {useMeta} from 'quasar'

const metaData = {
  // sets document title
  title: 'Index Page',
  // optional; sets final title as "Index Page - My Website", useful for multiple level meta
  titleTemplate: title => `${title} - My Website!!`,

  // meta tags
  meta: {
    description: {name: 'description', content: 'Page 1'},
    keywords: {name: 'keywords', content: 'Quasar website'},
    equiv: {'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8'},
    // note: for Open Graph type metadata you will need to use SSR, to ensure page is rendered by the server
    ogTitle: {
      property: 'og:title',
      // optional; similar to titleTemplate, but allows templating with other meta properties
      template(ogTitle) {
        return `${ogTitle} - My Website`
      }
    }
  },

  // <noscript> tags
  noscript: {
    default: 'This is content for browsers with no JS (or disabled JS)'
  }
}

useMeta(metaData)

const route = useRoute()

const tabsetId = ref<string | undefined>(undefined)

watchEffect(async () => {
  tabsetId.value = route.params.tabsetId as string
  console.log(`got tabsetId ${tabsetId.value}`)
})

</script>
