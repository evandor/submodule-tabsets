<template>
  <q-card flat bordered style="border:0px solid green;">

    <q-card-section
        class="q-ma-none q-pa-xs cursor-pointer bg-primary text-white"
        style="width:100%;">

      <div class="row items-baseline">
        <q-img v-if="thumbnail" style="border:0 dotted white;border-radius:3px;cursor: move"
               :ratio="16/9"
               :src="thumbnail">
        </q-img>
        <q-img v-else-if="props.tab.image && props.tab.image.startsWith('blob://')"
               style="border:0 dotted white;border-radius:5px"
               :src="imgFromBlob">
          <q-tooltip class="tooltip">Custom Screenshot</q-tooltip>
        </q-img>
        <q-img v-else-if="props.tab.image"
               style="border:0 dotted white;border-radius:5px"
               :src="props.tab.image">
          <q-tooltip class="tooltip">Custom Screenshot</q-tooltip>
        </q-img>
        <q-img v-else style="border:0 dotted white;border-radius:3px;cursor: move"
               :ratio="16/9"
               src="https://placehold.co/600x400?text=no+thumbnail" />
      </div>

    </q-card-section>
    <q-card-section class="q-ma-none q-pa-xs bg-primary text-white">

      <div class="row fit">
        <div class="col-12 cursor-pointer ellipsis">
          <TabFaviconWidget :tab="tab" width="16px" height="16px" class="q-mr-sm"/>
          <span @click="NavigationService.openOrCreateTab([props.tab.url || ''])">{{ shortUrl() }}</span>
        </div>
      </div>

    </q-card-section>


  </q-card>
</template>

<script setup lang="ts">

import {Tab} from "src/tabsets/models/Tab"
import {onMounted, PropType, ref, watchEffect} from "vue"
import NavigationService from "src/services/NavigationService"
import TabFaviconWidget from "src/tabsets/widgets/TabFaviconWidget.vue"
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useThumbnailsService} from "src/thumbnails/services/ThumbnailsService";

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  highlightUrl: {type: String, required: false}
})
const imgFromBlob = ref<string>("")
const thumbnail = ref<string | undefined>(undefined)

onMounted(() => {
  const blobImgPath = props.tab.image
  if (blobImgPath && blobImgPath.startsWith('blob://')) {
    useTabsetService().getBlob(blobImgPath.replace("blob://", ""))
        .then((res) => {
          let reader = new FileReader();
          reader.readAsDataURL(res.content);
          reader.onloadend = function () {
            let base64data = reader.result;
            if (base64data) {
              imgFromBlob.value = base64data.toString()
            }
          }
        })
        .catch((err) => console.error(err))
  }
})

const shortUrl = () => {
  if (props.tab.url) {
    return props.tab.url
        .replace("https://www.", "")
        .replace("http://www.", "")
        .replace("https://", "")
        .replace("http://", "")
  }
  return ""
}
const thumbnailFor = async (tab: Tab): Promise<string> => {
  return useThumbnailsService().getThumbnailFor(tab.id);
}

watchEffect(() => {
  if (props.tab) {
    // @ts-ignore
    thumbnailFor(props.tab)
        .then((tn: string) => {
          if (tn) {
            thumbnail.value = tn
          }
        })
  }
})

</script>
