<script setup lang="ts">
import AccountApi from '@/services/api/account'
import type { PasswordLoginReq } from '@/services/api/account/types'
import { useCredentialStore } from '@/stores/credential'
import CountdownButton from '@/views/components/CountdownButton.vue'
import { Message, type ValidatedError } from '@arco-design/web-vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

// 登录按钮的加载状态
const loginLoading = ref(false)
// GitHub登录按钮的加载状态
const githubLoading = ref(false)
// 登录表单的响应式数据
const loginForm = reactive<PasswordLoginReq>({
  account: '',
  password: '',
})
const formData = ref({ phoneNumber: '', code: '' })
// 用户凭证状态管理
const store = useCredentialStore()
// 路由实例
const router = useRouter()
const activatedTab = ref('phone')

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

const handlePhoneSubmit = async () => {
  try {
    // 设置登录加载状态
    loginLoading.value = true
    const resp = await AccountApi.phoneNumberLogin({
      phone_number: formData.value.phoneNumber,
      code: formData.value.code,
    })
    // 更新用户凭证信息
    store.update(resp.data)
    // 显示登录成功提示
    Message.success('登录成功')
    // 跳转到首页
    router.replace({ name: 'home-page' })
  } catch (error) {}
}

const handleSendCode = async () => {
  try {
    const resp = await AccountApi.sendSmsCode({ phone_number: formData.value.phoneNumber })
    if (resp.message) {
      Message.success(resp.message)
    }
  } catch (error) {}
}
</script>

<template>
  <div class="text-gray-900 font-bold text-2xl leading-8">欢迎使用虎子</div>
  <div class="text-base leading-6 text-gray-600">用虎子AI高效重塑生产力</div>

  <a-tabs v-model:active-key="activatedTab" class="flex flex-col w-full mt-12">
    <a-tab-pane key="phone" title="手机号登录" class="">
      <a-form
        :model="formData"
        @submit="handlePhoneSubmit"
        layout="vertical"
        ize="large"
        class="flex flex-col w-full my-6"
      >
        <a-form-item
          field="phoneNumber"
          label="手机号"
          hide-label
          :rules="[{ required: true, message: '手机号不能为空', trigger: ['blur'] }]"
        >
          <a-input v-model="formData.phoneNumber" allow-clear placeholder="请输入手机号">
            <template #prefix><icon-mobile /></template>
          </a-input>
        </a-form-item>
        <a-form-item
          field="code"
          label="验证码"
          hide-label
          :rules="[
            { required: true, message: '验证码不能为空' },
            { match: /^\d+$/, message: '必须是数字' },
          ]"
        >
          <div class="w-full flex items-center justify-between gap-4">
            <a-input
              v-model="formData.code"
              :length="6"
              style="width: 260px"
              placeholder="请输入验证码"
            />

            <CountdownButton @click="handleSendCode" class="rounded-sm bg-blue-800" />
          </div>
        </a-form-item>
        <a-button
          type="primary"
          size="large"
          html-type="submit"
          long
          class="rounded-sm bg-blue-800 mt-6"
          :loading="loginLoading"
          >登录 / 注册</a-button
        >
      </a-form>
    </a-tab-pane>
    <a-tab-pane key="email" title="账号登录" class="">
      <a-form
        :model="loginForm"
        layout="vertical"
        size="large"
        class="flex flex-col w-full my-6"
        @submit="handleLogin"
      >
        <a-form-item
          field="account"
          :rules="[{ required: true, message: '请输入手机号或邮箱' }]"
          hide-label
          :validate-trigger="['blur', 'change']"
        >
          <a-input v-model="loginForm.account" size="large" placeholder="手机号 / 邮箱" allow-clear>
            <template #prefix><icon-user /></template>
          </a-input>
        </a-form-item>
        <a-form-item
          field="password"
          :rules="[{ required: true, message: '请输入密码' }]"
          hide-label
          :validate-trigger="['blur', 'change']"
        >
          <a-input-password
            v-model="loginForm.password"
            size="large"
            placeholder="账号密码"
            allow-clear
            ><template #prefix><icon-lock /></template
          ></a-input-password>
        </a-form-item>
        <a-space :size="16" direction="vertical">
          <div class="flex justify-between">
            <a-checkbox>记住密码</a-checkbox>
            <a-link>忘记密码?</a-link>
          </div>
        </a-space>
        <a-button
          type="primary"
          size="large"
          html-type="submit"
          long
          class="rounded-sm bg-blue-800 mt-8"
          :loading="loginLoading"
          >登录</a-button
        >
      </a-form>
    </a-tab-pane>
  </a-tabs>
  <a-divider>第三方授权</a-divider>
  <a-button
    size="large"
    type="dashed"
    long
    class="rounded-sm mt-3"
    :loading="githubLoading"
    @click="handleGithubLogin"
    ><template #icon><icon-github /></template>Github</a-button
  >
</template>

<style scoped>
:deep(.arco-tabs-tab-active) {
  color: #193cb8 !important;
}

:deep(.arco-tabs-nav-ink) {
  background-color: #193cb8 !important;
}
</style>
