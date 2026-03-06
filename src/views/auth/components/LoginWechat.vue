<script setup lang="ts">
import AccountApi from '@/services/api/account'
import { onMounted, ref } from 'vue'

const visible = defineModel('visible', { type: Boolean, default: false })
const weChatConnectUrl = ref('')
const loading = ref(false)

const fetchData = async () => {
  try {
    loading.value = true
    const resp = await AccountApi.provider('wxmp')
    weChatConnectUrl.value = resp.data.redirect_url
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const handleCloseModal = () => {
  visible.value = false
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <div class="flex items-center gap-2 text-3xl font-bold text-gray-800">
      <icon-wechat class="text-green-500" />
      <div class="">微信登录</div>
    </div>
    <a-spin :loading="loading" class="flex justify-center items-center my-10">
      <iframe
        :src="weChatConnectUrl"
        width="300"
        height="380"
        scrolling="no"
        frameborder="0"
        allowtransparency="true"
      ></iframe>
    </a-spin>
    <a-button
      type="text"
      class="rounded-full border border-gray-200"
      size="small"
      @click="handleCloseModal"
    >
      <template #icon>
        <icon-close class="text-gray-500" width="20" height="20" />
      </template>
    </a-button>
  </div>
</template>

<style scoped></style>
