<script setup lang="ts">
import AccountApi from '@/services/api/account'
import { useAccountStore } from '@/stores/account'
import CountdownButton from '@/views/components/CountdownButton.vue'
import { Message } from '@arco-design/web-vue'
import { computed, onUnmounted, ref, watch } from 'vue'

const visible = defineModel('visible', { type: Boolean, default: false })
const formData = ref({ email: '', code: '' })
const store = useAccountStore()
const loading = ref(false)
const validateEmailHelpText = ref('')
const validateEmailStatus = ref('')

const isDisabled = computed(() => {
  return !formData.value.email || !formData.value.code || validateEmailStatus.value == 'error'
})

const handleCloseModal = () => {
  visible.value = false
}

const isEmailBound = async () => {
  try {
    const resp = await AccountApi.isEmailBound({ email: formData.value.email })
    if (resp.data.is_bound) {
      validateEmailHelpText.value = '邮箱已绑定'
      validateEmailStatus.value = 'error'
    } else {
      validateEmailHelpText.value = ''
      validateEmailStatus.value = 'success'
    }
  } catch (error) {}
}

const handleSubmit = async () => {
  try {
    loading.value = true
    const resp = await AccountApi.bindEmail({
      email: formData.value.email,
      code: formData.value.code,
    })
    if (resp.message) {
      Message.success(resp.message)
      formData.value.code = ''
      store.account.email = formData.value.email
      handleCloseModal()
    }
  } catch (error) {
    formData.value.code = ''
  } finally {
    loading.value = false
    formData.value.code = ''
  }
}

const handleSendCode = async () => {
  try {
    const resp = await AccountApi.sendMailCode({ email: formData.value.email })
    if (resp.message) {
      Message.success(resp.message)
    }
  } catch (error) {}
}

const stop = watch(
  () => visible.value,
  (val) => {
    if (val) {
      formData.value.email = store.account.email
    }
  },
)

onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="460"
    :title="store.account.email ? '修改邮箱' : '绑定邮箱'"
    :footer="false"
    :unmount-on-close="true"
    title-align="start"
    class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <a-form :model="formData" @submit="handleSubmit" layout="vertical">
      <a-form-item
        field="email"
        label="邮箱"
        asterisk-position="end"
        :rules="[{ required: true, message: '邮箱不能为空', trigger: ['blur'] }]"
        :help="validateEmailHelpText"
        :validate-status="validateEmailStatus"
      >
        <a-input
          v-model="formData.email"
          allow-clear
          @blur="isEmailBound"
          placeholder="请输入邮箱"
        />
      </a-form-item>
      <a-form-item
        field="code"
        label="验证码"
        asterisk-position="end"
        :rules="[
          { required: true, message: '验证码不能为空' },
          { match: /^\d+$/, message: '必须是数字' },
        ]"
      >
        <div class="w-full flex items-center justify-between">
          <a-verification-code v-model="formData.code" :length="6" style="width: 260px" />
          <CountdownButton @click="handleSendCode" />
        </div>
      </a-form-item>
      <div class="flex justify-end mt-8">
        <a-button
          type="outline"
          class="border-gray-300 text-gray-500 mr-3"
          @click="handleCloseModal"
          >取消</a-button
        >
        <a-button :loading="loading" type="primary" html-type="submit" :disabled="isDisabled"
          >确定</a-button
        >
      </div>
    </a-form>
  </a-modal>
</template>

<style scoped></style>
