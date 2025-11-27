<script setup lang="ts">
import { ref } from 'vue'

const visible = defineModel({ type: Boolean, default: false })
const formData = ref()

const handleCloseModal = () => {
  visible.value = false
}

const handleSubmit = () => {}
</script>

<template>
  <a-modal
    :visible="visible"
    title="检索设置"
    title-align="start"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <!-- 表单 -->
    <a-form :model="formData" @submit="handleSubmit" label-align="left">
      <a-form-item field="retrieval_strategy" label="检索策略">
        <a-radio-group
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
          <a-slider :step="1" :min="1" :max="10" />
          <a-input-number
            class="w-[80px] bg-white border border-gray-300"
            :default-value="4"
            size="small"
          />
        </div>
      </a-form-item>
      <a-form-item field="score" label="最小匹配度">
        <div class="flex items-center gap-4 w-full pl-3">
          <a-slider :step="0.01" :min="0" :max="0.99" />
          <a-input-number
            class="w-[80px] bg-white border border-gray-300"
            :default-value="0.5"
            size="small"
          />
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped></style>
