<script setup lang="ts">
import type { DatasetHitReq } from '@/services/api/dataset/documents/type'

/**
 * 组件事件接口定义
 */
interface Emits {
  (e: 'close'): void
  (e: 'submit'): void
}
// 定义组件的事件发射器
const emit = defineEmits<Emits>()
// 定义visible模型，用于控制模态框的显示/隐藏状态
const visible = defineModel('visible', { type: Boolean, default: false })
// 定义retrievalForm模型，用于存储检索设置表单数据
const retrievalForm = defineModel<DatasetHitReq>('retrievalSetting', { type: Object, default: {} })

// 处理关闭模态框的方法
const handleCloseModal = () => {
  // 设置模态框为不可见
  visible.value = false
  // 触发close事件
  emit('close')
}

// 处理表单提交的方法
const handleSubmit = () => {
  // 设置模态框为不可见
  visible.value = false
  // 触发submit事件
  emit('submit')
}
</script>

<template>
  <a-modal
    :visible="visible"
    hide-title
    modal-class="rounded-xl"
    body-class="pt-3"
    @cancel="handleCloseModal"
    @ok="handleSubmit"
  >
    <div class="flex items-center justify-between pb-3">
      <div class="text-black font-bold text-xl">检索设置</div>
      <a-button type="text" size="mini" class="rounded-full" @click="visible = false">
        <template #icon>
          <icon-close class="text-gray-800 font-bold" />
        </template>
      </a-button>
    </div>
    <!-- 表单 -->
    <a-form :model="retrievalForm" @submit="handleSubmit" label-align="left">
      <a-form-item field="retrieval_strategy" label="检索策略">
        <a-radio-group
          v-model="retrievalForm.retrieval_strategy"
          default-value="semantic"
          :options="[
            { label: '混合策略', value: 'hybrid' },
            { label: '全问检索', value: 'full_text' },
            { label: '相似性检索', value: 'semantic' },
          ]"
        ></a-radio-group>
      </a-form-item>
      <a-form-item field="k" label="最大召回数量">
        <div class="flex items-center gap-4 w-full pl-3">
          <a-slider v-model="retrievalForm.k" :step="1" :min="1" :max="10" />
          <a-input-number
            v-model="retrievalForm.k"
            class="w-[80px] bg-white border border-gray-300"
            :default-value="5"
            size="small"
          />
        </div>
      </a-form-item>
      <a-form-item field="score" label="最小匹配度">
        <div class="flex items-center gap-4 w-full pl-3">
          <a-slider v-model="retrievalForm.score" :step="0.01" :min="0" :max="0.99" />
          <a-input-number
            v-model="retrievalForm.score"
            class="w-[80px] bg-white border border-gray-300"
            :min="0"
            :max="0.99"
            :default-value="0.5"
            size="small"
          />
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped></style>
