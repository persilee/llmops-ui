<script setup lang="ts">
import type { GetDebugConversationMessagesWithPage } from '@/services/api/apps/types'
import { useAccountStore } from '@/stores/account'

const props = defineProps<{
  message: GetDebugConversationMessagesWithPage
}>()

const accountStore = useAccountStore()
</script>

<template>
  <div class="flex flex-row gap-2 mb-6">
    <!-- 人类头像 -->
    <a-avatar class="shrink-0 bg-white" :size="34">
      <img :src="accountStore.account.avatar" class="p-0.5" />
    </a-avatar>
    <div class="flex flex-col items-start gap-2">
      <!-- 人类名称 -->
      <div class="font-semibold text-gray-700">
        {{ accountStore.account.name }}
      </div>
      <div
        class="max-w-max bg-blue-600 text-white border border-blue-700 px-4 py-3 rounded-lg leading-5"
      >
        {{ message.query }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
