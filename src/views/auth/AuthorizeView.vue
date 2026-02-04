<script setup lang="ts">
import AccountApi from '@/services/api/account'
import { useCredentialStore } from '@/stores/credential'
import { Message } from '@arco-design/web-vue'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const store = useCredentialStore()

onMounted(async () => {
  try {
    // 调用授权API，传入第三方提供商名称和授权码
    const resp = await AccountApi.authorize(
      route.params?.providerName as string, // 从路由参数中获取第三方提供商名称
      route.query?.code as string, // 从查询参数中获取授权码
    )
    // 更新凭证存储中的用户信息
    store.update(resp.data)
    // 显示授权成功的提示消息
    Message.success('授权成功')
    // 授权成功后重定向到首页
    router.replace({ name: 'home-page' })
  } catch (error) {
    // 授权失败时重定向到登录页面
    router.replace({ name: 'auth-login' })
  } finally {
    // finally块目前为空，可以在这里添加清理代码
  }
})
</script>

<template>
  <div class="w-full min-h-screen flex items-center justify-center bg-white">
    <a-spin tip="第三方授权中，请稍后..."></a-spin>
  </div>
</template>

<style scoped></style>
