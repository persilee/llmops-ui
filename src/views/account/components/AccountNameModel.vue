<script setup lang="ts">
import AccountApi from '@/services/api/account'
import { useAccountStore } from '@/stores/account'
import { Message } from '@arco-design/web-vue'
import { onUnmounted, ref, watch } from 'vue'

const visible = defineModel('visible', { type: Boolean, default: false })
const formData = ref({ name: '' })
const store = useAccountStore()
const loading = ref(false)

const handleCloseModal = () => {
  visible.value = false
}

const handleSubmit = async () => {
  try {
    // 开启加载状态
    loading.value = true
    // 调用API更新昵称
    const resp = await AccountApi.updateName({ name: formData.value.name })
    // 更新store中的昵称
    store.account.name = formData.value.name
    // 显示修改成功提示
    Message.success(resp.message)
    handleCloseModal()
  } catch (error) {
    // 错误处理
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

const stop = watch(
  () => visible.value,
  (val) => {
    if (val) {
      formData.value.name = store.account.name
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
    :title="'编辑账号昵称'"
    :footer="false"
    :unmount-on-close="true"
    title-align="start"
    class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <a-form :model="formData" @submit="handleSubmit" layout="vertical">
      <a-form-item
        field="name"
        label="账号昵称"
        asterisk-position="end"
        :rules="[{ required: true, message: '账号昵称不能为空' }]"
      >
        <a-input v-model="formData.name" allow-clear />
      </a-form-item>
      <div class="flex justify-end mt-5">
        <a-button
          type="outline"
          class="border-gray-300 text-gray-500 mr-3"
          @click="handleCloseModal"
          >取消</a-button
        >
        <a-button :loading="loading" type="primary" html-type="submit" :disabled="!formData.name"
          >确定</a-button
        >
      </div>
    </a-form>
  </a-modal>
</template>

<style scoped></style>
