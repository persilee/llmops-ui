<script setup lang="ts">
import AccountApi from '@/services/api/account'
import { useAccountStore } from '@/stores/account'
import * as Storage from '@/utils/storage'
import { Message } from '@arco-design/web-vue'
import { onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const visible = defineModel('visible', { type: Boolean, default: false })

const formData = ref({ password: '' })
const loading = ref(false)
const store = useAccountStore()
const router = useRouter()

const handleSubmit = async () => {
  try {
    // 开启加载状态
    loading.value = true
    // 调用API更新密码
    const resp = await AccountApi.updatePassword({ password: formData.value.password })

    // 显示修改成功提示
    Message.success('修改密码成功，请重新登录，即将跳转登录页...')
    // 清除存储的登录凭证
    Storage.remove('credential')
    // 延迟3秒后跳转到登录页
    setTimeout(() => {
      router.push({ name: 'auth-login' })
    }, 3000)
  } catch (error) {
    // 错误处理
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

const handleCloseModal = () => {
  visible.value = false
}

const stop = watch(
  () => visible.value,
  (val) => {
    if (val) {
      formData.value.password = ''
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
    :width="420"
    :title="'修改账号密码'"
    :footer="false"
    :unmount-on-close="true"
    title-align="start"
    class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <a-form :model="formData" @submit="handleSubmit" layout="vertical">
      <a-form-item
        field="password"
        label="账号密码"
        asterisk-position="end"
        :rules="[{ required: true, message: '账号密码不能为空' }]"
      >
        <a-input-password v-model="formData.password" allow-clear />
        <template #extra>
          <div>密码最少包含一个字母、一个数字，并且长度是8-16</div>
        </template>
      </a-form-item>
      <div class="flex justify-end mt-5">
        <a-button
          type="outline"
          class="border-gray-300 text-gray-500 mr-3"
          @click="handleCloseModal"
          >取消</a-button
        >
        <a-button
          :loading="loading"
          type="primary"
          html-type="submit"
          :disabled="!formData.password"
          >确定</a-button
        >
      </div>
    </a-form>
  </a-modal>
</template>

<style scoped></style>
