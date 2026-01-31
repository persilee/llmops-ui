<script setup lang="ts">
import WebAppApi from '@/services/api/web-app'
import type { GetPublishedConfigResp } from '@/services/api/web-app/types'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from './AppView.store'

const loading = ref(false)
const regenerateLoading = ref(false)
const wechatLoading = ref(false)
const publishedConfig = ref<GetPublishedConfigResp>()
const router = useRouter()
const store = useAppStore()
const webAppUrl = computed(() => {
  if (publishedConfig.value?.web_app?.status === 'published') {
    return getFullPath('web-app-chat', {
      token: publishedConfig.value?.web_app?.token,
    })
  }
  return ''
})
const isPublished = computed(() => {
  return store.app?.status === 'published'
})

const getFullPath = (name: string, params = {}, query = {}) => {
  // 通过 router.resolve 获取路由的完整路径
  const { href } = router.resolve({ name, params, query })

  // 如果需要包括 host 部分，结合 window.location.origin
  return window.location.origin + href
}

const fetchPublishedConfig = async () => {
  try {
    if (store.app && store.app.id) {
      loading.value = true
      const resp = await WebAppApi.getPublishedConfig(store.app.id)
      publishedConfig.value = resp.data
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const copyUrl = async (url: string) => {
  try {
    // 使用Clipboard API将文本复制到剪贴板
    await navigator.clipboard.writeText(url)

    // 复制成功时显示成功提示消息
    Message.success('复制成功')
  } catch (err) {
    // 复制失败时捕获错误并显示失败提示消息
    Message.error('复制失败' + err)
  }
}

const regenerateWebAppToken = async () => {
  try {
    if (store.app && store.app.id) {
      regenerateLoading.value = false
      const resp = await WebAppApi.regenerateWebAppToken(store.app.id)
      if (publishedConfig.value?.web_app) {
        publishedConfig.value.web_app.token = resp.data.token
      }
    }
  } catch (error) {
  } finally {
    regenerateLoading.value = false
  }
}

const goToWebApp = () => {
  if (webAppUrl.value) {
    window.open(webAppUrl.value, '_blank')
  }
}

onMounted(() => {
  fetchPublishedConfig()
})
</script>

<template>
  <div class="bg-white flex-1 w-full min-h-0 px-6 py-5">
    <!-- 顶部提示信息 -->
    <a-alert class="mb-5 rounded-sm" closable>
      如应用访问链接或二维码意外泄露，请及时重新生成或进行停止分发，避免资源出现异常消耗
    </a-alert>
    <!-- 发布渠道列表 -->
    <a-spin :loading="loading" class="w-full">
      <table class="w-full rounded-sm">
        <thead>
          <tr class="h-10 bg-gray-100 rounded-sm">
            <th class="font-normal text-left px-4 text-gray-700 border-r border-white rounded-sm">
              发布渠道
            </th>
            <th class="font-normal text-left px-4 text-gray-700 border-r border-white rounded-sm">
              状态
            </th>
            <th class="font-normal text-left px-4 text-gray-700 rounded-sm">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-200">
            <td class="py-3 px-4 w-1/2">
              <div class="flex items-center gap-2">
                <a-avatar :size="36" shape="square" class="bg-blue-100">
                  <icon-compass :size="18" class="text-blue-600" />
                </a-avatar>
                <div class="flex flex-col gap-1">
                  <div class="text-gray-700 font-semibold">网页版</div>
                  <div class="text-gray-500 text-xs">可通过访问PC网页立即开始对话。</div>
                </div>
              </div>
            </td>
            <td class="py-3 px-4 w-1/12">
              <a-tag v-if="!isPublished" color="gray">
                <template #icon>
                  <icon-minus-circle />
                </template>
                未发布
              </a-tag>
              <a-tag v-else color="green">
                <template #icon>
                  <icon-check-circle-fill />
                </template>
                已发布
              </a-tag>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <!-- 左侧URL链接 -->
                <div class="flex-1 flex items-center">
                  <div
                    :class="`w-full bg-gray-100 h-8 leading-8 px-3 text-gray-400  line-clamp-1 break-all ${isPublished ? 'text-gray-600' : 'text-gray-400'}`"
                  >
                    <template v-if="isPublished">
                      {{ webAppUrl }}
                    </template>
                    <template v-else>应用未发布，无可访问链接</template>
                  </div>
                  <a-button
                    type="text"
                    class="bg-blue-100 rounded-[0px]"
                    @click="copyUrl(webAppUrl)"
                  >
                    复制
                  </a-button>
                  <a-button
                    :loading="regenerateLoading"
                    :disabled="!isPublished"
                    type="primary"
                    class="px-2 rounded-r-md rounded-l-[0px]"
                    @click="regenerateWebAppToken"
                  >
                    重新生成
                  </a-button>
                </div>
                <!-- 右侧访问按钮 -->
                <a-button
                  class="rounded-md px-2 border border-gray-200 bg-white"
                  :disabled="!isPublished"
                  @click="goToWebApp"
                >
                  立即访问
                </a-button>
              </div>
            </td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="py-3 px-4 w-1/2">
              <div class="flex items-center gap-2">
                <a-avatar :size="36" shape="square" class="bg-green-100">
                  <icon-wechat :size="18" class="text-green-700" />
                </a-avatar>
                <div class="flex flex-col gap-1">
                  <div class="text-gray-700 font-semibold">微信公众号（订阅号、服务号）</div>
                  <div class="text-gray-500 text-xs">
                    接入微信公众号，自动回复用户消息，助理高效私域运营。
                  </div>
                </div>
              </div>
            </td>
            <td class="py-3 px-4 w-1/12">
              <a-tag v-if="true" color="gray">
                <template #icon>
                  <icon-minus-circle />
                </template>
                未配置
              </a-tag>
              <a-tag v-else color="green">
                <template #icon>
                  <icon-check-circle-fill />
                </template>
                已配置
              </a-tag>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <!-- 立即配置 -->
                <a-button :loading="wechatLoading" type="primary" class="rounded-md px-2">
                  <template #icon>
                    <icon-settings />
                  </template>
                  立即配置
                </a-button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </a-spin>
  </div>
</template>

<style scoped></style>
