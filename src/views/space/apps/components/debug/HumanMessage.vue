<script setup lang="ts">
import type { GetDebugConversationMessagesWithPage } from '@/services/api/apps/types'
import { useAccountStore } from '@/stores/account'
import FancyboxView from '@/views/components/FancyboxView.vue'

const props = defineProps<{
  message: GetDebugConversationMessagesWithPage
  imageUrls?: string[]
}>()

const accountStore = useAccountStore()
</script>

<template>
  <div class="w-full flex-1 flex">
    <div class="w-full flex flex-row gap-2 mb-6 self-end">
      <div class="w-full flex flex-col gap-2 items-end pl-[42px]">
        <!-- 人类名称 -->
        <div class="font-semibold text-gray-700">
          {{ accountStore.account.name }}
        </div>
        <div
          v-if="imageUrls && imageUrls.length > 0"
          class="w-full flex items-center justify-end mb-1"
        >
          <FancyboxView>
            <div v-for="(imgUrl, idx) in imageUrls" :key="idx" class="">
              <a data-fancybox="gallery" :href="imgUrl" :data-thumb-src="imgUrl">
                <img
                  v-if="imageUrls.length == 1"
                  :src="imgUrl"
                  class="w-[248px] h-auto rounded-lg overflow-clip object-cover object-center"
                  crossorigin="anonymous"
                />
                <img
                  v-else-if="imageUrls.length == 2"
                  :src="imgUrl"
                  class="w-[188px] h-[188px] rounded-lg overflow-clip object-cover object-center"
                  crossorigin="anonymous"
                />
                <img
                  v-else
                  :src="imgUrl"
                  class="w-[120px] h-[120px] rounded-lg overflow-clip object-cover object-center"
                  crossorigin="anonymous"
                />
              </a>
            </div>
          </FancyboxView>
        </div>
        <div class="max-w-max bg-blue-200 text-gray-700 px-4 py-3 rounded-lg leading-5">
          {{ message.query }}
        </div>
      </div>
      <!-- 人类头像 -->
      <a-avatar class="shrink-0 bg-white" :size="34">
        <img :src="accountStore.account.avatar" class="p-0.5" />
      </a-avatar>
    </div>
  </div>
</template>

<style scoped></style>
