<script setup lang="ts">
import AccountApi from '@/services/api/account'
import { useAccountStore } from '@/stores/account'
import CountdownButton from '@/views/components/CountdownButton.vue'
import { Message } from '@arco-design/web-vue'
import { computed, ref } from 'vue'

const visible = defineModel('visible', { type: Boolean, default: false })
const store = useAccountStore()
const formData = ref({ phoneNumber: '', code: '' })
const loading = ref(false)
const validatePhoneHelpText = ref('')
const validatePhoneStatus = ref('')

const isDisabled = computed(() => {
  return !formData.value.phoneNumber || !formData.value.code || validatePhoneStatus.value == 'error'
})

const handleCloseModal = () => {
  visible.value = false
}

const handleSubmit = async () => {
  try {
    loading.value = true
    const resp = await AccountApi.bindPhoneNumber({
      phone_number: formData.value.phoneNumber,
      code: formData.value.code,
    })
    if (resp.message) {
      Message.success(resp.message)
      formData.value.code = ''
      store.account.phone_number = formData.value.phoneNumber
      handleCloseModal()
    }
  } catch (error) {
    formData.value.code = ''
  } finally {
    loading.value = false
    formData.value.code = ''
  }
}

const isPhoneBound = async () => {
  try {
    const resp = await AccountApi.isPhoneNumberBound({ phone_number: formData.value.phoneNumber })
    if (resp.data.is_bound) {
      validatePhoneHelpText.value = '手机号已绑定'
      validatePhoneStatus.value = 'error'
    } else {
      validatePhoneHelpText.value = ''
      validatePhoneStatus.value = 'success'
    }
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
  <a-modal
    :visible="visible"
    :width="460"
    :title="store.account.phone_number ? '修改手机号' : '绑定手机号'"
    :footer="false"
    :unmount-on-close="true"
    title-align="start"
    class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <a-form :model="formData" @submit="handleSubmit" layout="vertical">
      <a-form-item
        field="phoneNumber"
        label="手机号"
        asterisk-position="end"
        :rules="[{ required: true, message: '手机号不能为空', trigger: ['blur'] }]"
        :help="validatePhoneHelpText"
        :validate-status="validatePhoneStatus"
      >
        <a-input
          v-model="formData.phoneNumber"
          allow-clear
          @blur="isPhoneBound"
          placeholder="请输入手机号"
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
