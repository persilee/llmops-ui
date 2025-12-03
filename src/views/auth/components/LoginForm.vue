<script setup lang="ts">
import AccountApi from '@/services/api/account'
import type { PasswordLoginReq } from '@/services/api/account/types'
import { useCredentialStore } from '@/stores/credential'
import { Message, type ValidatedError } from '@arco-design/web-vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

// 登录按钮的加载状态
const loginLoading = ref(false)
// GitHub登录按钮的加载状态
const githubLoading = ref(false)
// 登录表单的响应式数据
const loginForm = reactive<PasswordLoginReq>({
  email: '',
  password: '',
})
// 用户凭证状态管理
const store = useCredentialStore()
// 路由实例
const router = useRouter()

/**
 * 处理GitHub第三方登录
 * @description 获取GitHub授权URL并重定向到授权页面
 */
const handleGithubLogin = async () => {
  try {
    // 设置GitHub登录加载状态
    githubLoading.value = true
    // 调用GitHub授权API获取重定向URL
    const resp = await AccountApi.provider('github')
    // 重定向到GitHub授权页面
    window.location.href = resp.data.redirect_url
  } catch (error) {
    // 错误处理
  } finally {
    // 重置加载状态
    githubLoading.value = false
  }
}

/**
 * 处理用户登录
 * @param {Object} params - 参数对象
 * @param {Record<string, any>} params.values - 表单提交的值
 * @param {Record<string, ValidatedError> | undefined} params.errors - 表单验证错误信息
 */
const handleLogin = async ({
  values,
  errors,
}: {
  values: Record<string, any>
  errors: Record<string, ValidatedError> | undefined
}) => {
  // 如果存在验证错误，直接返回
  if (errors) return

  try {
    // 设置登录加载状态
    loginLoading.value = true
    // 调用登录API
    const resp = await AccountApi.passwordLogin(loginForm)
    // 更新用户凭证信息
    store.update(resp.data)
    // 显示登录成功提示
    Message.success('登录成功')
    // 跳转到首页
    router.replace({ name: 'home-page' })
  } catch (error: any) {
    // 登录失败时清空密码
    loginForm.password = ''
  } finally {
    // 无论成功失败，都重置加载状态
    loginLoading.value = false
  }
}
</script>

<template>
  <div class="text-gray-900 font-bold text-2xl leading-8">LLMOps AppBuilder</div>
  <div class="text-base leading-6 text-gray-600">高效开发你的AI原生应用</div>

  <a-form
    :model="loginForm"
    layout="vertical"
    size="large"
    class="flex flex-col w-full mt-8"
    @submit="handleLogin"
  >
    <a-form-item
      field="email"
      :rules="[{ type: 'email', required: true, message: '请输入邮箱' }]"
      hide-label
      :validate-trigger="['blur', 'change']"
    >
      <a-input v-model="loginForm.email" size="large" placeholder="登录账号"
        ><template #prefix><icon-user /></template
      ></a-input>
    </a-form-item>
    <a-form-item
      field="password"
      :rules="[{ required: true, message: '请输入密码' }]"
      hide-label
      :validate-trigger="['blur', 'change']"
    >
      <a-input-password v-model="loginForm.password" size="large" placeholder="账号密码"
        ><template #prefix><icon-lock /></template
      ></a-input-password>
    </a-form-item>
    <a-space :size="16" direction="vertical">
      <div class="flex justify-between">
        <a-checkbox>记住密码</a-checkbox>
        <a-link>忘记密码?</a-link>
      </div>
      <a-button
        type="primary"
        size="large"
        html-type="submit"
        long
        class="rounded-sm bg-blue-800"
        :loading="loginLoading"
        >登录</a-button
      >
      <a-divider>第三方授权</a-divider>
      <a-button
        size="large"
        type="dashed"
        long
        class="rounded-sm"
        :loading="githubLoading"
        @click="handleGithubLogin"
        ><template #icon><icon-github /></template>Github</a-button
      >
    </a-space>
  </a-form>
</template>

<style scoped></style>
