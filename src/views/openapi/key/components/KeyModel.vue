<script setup lang="ts">
import type { GetAPIKeysWithPage, UpdateAPIKeyReq } from '@/services/api/openapi/types'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  openApiKey?: GetAPIKeysWithPage
}>()
const visible = defineModel('visible', { type: Boolean, default: false })
const keyData = ref<UpdateAPIKeyReq>({
  is_active: true,
  remark: '',
})

const emits = defineEmits(['handleSaveKey'])

const handleCloseModal = () => {
  visible.value = false
}

const stop = watch(visible, (val) => {
  if (val && props.openApiKey) {
    keyData.value = props.openApiKey
  }
})

onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="460"
    :title="openApiKey ? '编辑密钥' : '新增密钥'"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <div class="flex gap-0.5">
          <div class="text-gray-900">密钥状态</div>
          <div class="text-red-500">*</div>
        </div>
        <a-switch
          class="w-fit"
          v-model:model-value="keyData.is_active"
          type="round"
          size="small"
        ></a-switch>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex gap-0.5">
          <div class="text-gray-900">备注</div>
        </div>
        <a-textarea
          v-model="keyData.remark"
          class="flex-1 rounded-lg bg-white border border-gray-200 focus-within:border-blue-600"
          placeholder="请输入秘钥备注，用于描述秘钥基础信息"
          show-word-limit
          :max-length="2000"
          :auto-size="{ minRows: 4, maxRows: 4 }"
        ></a-textarea>
      </div>

      <!-- 底部按钮 -->
      <div class="flex justify-end">
        <a-button
          type="outline"
          class="border-gray-300 text-gray-500 mr-3"
          @click="handleCloseModal"
          >取消</a-button
        >
        <a-button
          type="primary"
          class=""
          @click="emits('handleSaveKey', keyData, openApiKey ? 'edit' : 'add')"
          >保存</a-button
        >
      </div>
    </div>
  </a-modal>
</template>

<style scoped></style>
