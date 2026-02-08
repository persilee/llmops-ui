<script setup lang="ts">
import type { GetDebugConversationMessagesWithPage } from '@/services/api/apps/types'
import { useAccountStore } from '@/stores/account'

const props = defineProps<{
  message: GetDebugConversationMessagesWithPage
}>()

const accountStore = useAccountStore()
</script>

<template>
  <div class="w-full flex-1 flex">
    <div class="w-full flex flex-row gap-2 mb-6 self-end">
      <!-- 人类头像 -->
      <div class="w-full flex flex-col gap-2 items-end">
        <!-- 人类名称 -->
        <div class="font-semibold text-gray-700">
          {{ accountStore.account.name }}
        </div>
        <div class="max-w-max bg-blue-200 text-gray-700 px-4 py-3 rounded-lg leading-5">
          {{ message.query }}
        </div>
      </div>
      <a-avatar class="shrink-0 bg-white" :size="34">
        <img :src="accountStore.account.avatar" class="p-0.5" />
      </a-avatar>
    </div>
  </div>
</template>

<style scoped></style>
