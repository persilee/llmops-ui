<script setup lang="ts">
import AccountApi from '@/services/api/account'
import type { PasswordLoginReq } from '@/services/api/account/types'
import { useCredentialStore } from '@/stores/credential'
import CountdownButton from '@/views/components/CountdownButton.vue'
import { Message } from '@arco-design/web-vue'
import { onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginStore } from '../LoginView.store'

const activatedTab = ref('phone')
const formData = ref({ phoneNumber: '', code: '' })
// 登录表单的响应式数据
const loginForm = reactive<PasswordLoginReq>({
  account: '',
  password: '',
})
const loginLoading = ref(false)
const store = useCredentialStore()
const loginStore = useLoginStore()
const router = useRouter()
const hiedPassword = ref(true)

const handlePhoneBind = async () => {
  try {
    // 设置登录加载状态
    loginLoading.value = true
    const resp = await AccountApi.phoneNumberBindAccount({
      phone_number: formData.value.phoneNumber,
      code: formData.value.code,
      oauth_info: store.credential.provider_info,
    })
    // 显示登录成功提示
    Message.success('登录成功')
    // 跳转到首页
    router.replace({ name: 'home-page' })
    // 更新用户凭证信息
    store.update(resp.data)
  } catch (error) {
  } finally {
    // 无论成功失败，都重置加载状态
    loginLoading.value = false
    loginStore.isTyping = false
    loginStore.isPassword = false
    loginStore.showPassword = false
  }
}

const handleAccountBind = async () => {
  try {
    // 设置登录加载状态
    loginLoading.value = true
    const resp = await AccountApi.passwordBindAccount({
      account: loginForm.account,
      password: loginForm.password,
      oauth_info: store.credential.provider_info,
    })
    // 显示登录成功提示
    Message.success('登录成功')
    // 跳转到首页
    router.replace({ name: 'home-page' })
    // 更新用户凭证信息
    store.update(resp.data)
  } catch (error) {
  } finally {
    // 无论成功失败，都重置加载状态
    loginLoading.value = false
    loginStore.isTyping = false
    loginStore.isPassword = false
    loginStore.showPassword = false
  }
}

const handleSendCode = async () => {
  try {
    const resp = await AccountApi.sendSmsCode({ phone_number: formData.value.phoneNumber })
    if (resp.message) {
      Message.success(resp.message)
    }
  } catch (error) {}
}

const handleTabClick = (key: string) => {
  activatedTab.value = key

  loginStore.isTyping = false
  loginStore.isPassword = false
  loginStore.showPassword = false
}

const handleInput = () => {
  if (formData.value.code) {
    loginStore.isTyping = false
    loginStore.isPassword = true
    loginStore.showPassword = true
  } else {
    loginStore.isPassword = false
    loginStore.showPassword = false
  }
}

const handlePasswordInput = () => {
  if (loginForm.password && hiedPassword.value) {
    loginStore.isTyping = false
    loginStore.isPassword = false
    loginStore.showPassword = false
  } else if (hiedPassword.value == false && loginForm.password) {
    loginStore.isTyping = false
    loginStore.isPassword = false
    loginStore.showPassword = true
  } else {
    loginStore.isTyping = false
    loginStore.isPassword = false
    loginStore.showPassword = false
  }
}

const stop = watch(
  () => hiedPassword.value,
  (newVal) => {
    if (newVal) {
      loginStore.isTyping = false
      loginStore.isPassword = false
      loginStore.showPassword = false
    } else {
      loginStore.isTyping = true
      loginStore.isPassword = true
      loginStore.showPassword = true
    }
  },
)

onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-tabs
    v-model:active-key="activatedTab"
    :header-padding="false"
    class="flex flex-col w-full mt-12"
    @tab-click="handleTabClick"
  >
    <a-tab-pane key="phone" title="通过验证手机号绑定" class="">
      <a-form
        :model="formData"
        @submit="handlePhoneBind"
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
          <a-input
            v-model="formData.phoneNumber"
            allow-clear
            placeholder="请输入手机号"
            @focus="loginStore.isTyping = true"
            @blur="loginStore.isTyping = false"
          >
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
              @input="handleInput()"
            />
            <CountdownButton
              @click="handleSendCode"
              class="rounded-sm bg-blue-800"
              :disabled="formData.phoneNumber.trim() === ''"
            />
          </div>
        </a-form-item>
        <a-button
          type="primary"
          size="large"
          html-type="submit"
          long
          class="rounded-sm bg-blue-800 mt-6"
          :loading="loginLoading"
          >绑定</a-button
        >
      </a-form>
    </a-tab-pane>
    <a-tab-pane key="account" title="通过验证账号密码绑定" class="">
      <a-form
        v-if="activatedTab === 'account'"
        :model="loginForm"
        layout="vertical"
        size="large"
        class="flex flex-col w-full my-6"
        @submit="handleAccountBind"
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
            @input="handlePasswordInput()"
            @blur="loginStore.isTyping = false"
            ><template #prefix><icon-lock /></template
          ></a-input-password>
        </a-form-item>
        <a-button
          type="primary"
          size="large"
          html-type="submit"
          long
          class="rounded-sm bg-blue-800 mt-8"
          :loading="loginLoading"
          >绑定</a-button
        >
      </a-form>
    </a-tab-pane>
  </a-tabs>
</template>

<style scoped></style>
