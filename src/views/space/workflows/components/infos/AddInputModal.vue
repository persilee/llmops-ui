<script setup lang="ts">
import type { ValidatedError } from '@arco-design/web-vue'
import { cloneDeep } from 'lodash-es'
import { ref, watch } from 'vue'

const props = defineProps<{
  inputData?: any
}>()
const emits = defineEmits(['updateInput'])
const visible = defineModel('visible', { type: Boolean, default: false })
const formData = ref({ name: '', type: 'string', description: '', required: true })

const handleCloseModal = () => {
  visible.value = false
}

const onSubmit = async ({ errors }: { errors: Record<string, ValidatedError> | undefined }) => {
  if (errors) return
  if (props.inputData) {
    emits('updateInput', formData.value)
  } else {
    emits('updateInput', formData.value)
  }

  visible.value = false
}

watch(
  () => visible.value,
  (val) => {
    if (val && props.inputData) {
      formData.value = cloneDeep(props.inputData)
    } else {
      formData.value = { name: '', type: 'string', description: '', required: true }
    }
  },
)
</script>

<template>
  <a-modal
    :visible="visible"
    :width="460"
    :title="props.inputData ? '编辑变量' : '添加变量'"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <!-- 输入数据表单 -->
    <a-form :model="formData" size="mini" auto-label-width @submit="onSubmit">
      <div class="flex flex-col gap-2">
        <!-- 变量字段 -->
        <a-form-item field="name" label="参数名称" required asterisk-position="end">
          <a-input v-model="formData.name" size="small" placeholder="请输入变量名称" />
        </a-form-item>
        <a-form-item field="type" label="变量类型" required asterisk-position="end">
          <a-select size="mini" v-model="formData.type">
            <a-option value="string">STRING</a-option>
            <a-option value="int">INT</a-option>
            <a-option value="float">FLOAT</a-option>
            <a-option value="boolean">BOOLEAN</a-option>
            <a-option value="list[string]">LIST[STRING]</a-option>
            <a-option value="list[int]">LIST[INT]</a-option>
            <a-option value="list[float]">LIST[FLOAT]</a-option>
            <a-option value="list[boolean]">LIST[BOOLEAN]</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="description" label="参数描述" required asterisk-position="end">
          <a-textarea
            :auto-size="{ minRows: 3, maxRows: 3 }"
            v-model="formData.description"
            size="small"
            placeholder="请准确描述该参数锁代表的含义，这将帮助大模型更好理解用户意图。"
          />
        </a-form-item>
        <a-form-item field="required" label="是否必填" required asterisk-position="end">
          <a-switch size="small" v-model="formData.required" />
        </a-form-item>
        <div class="flex justify-end">
          <a-button
            type="outline"
            class="border-gray-300 text-gray-500 mr-3"
            @click="handleCloseModal"
            >取消</a-button
          >
          <a-button type="primary" class="" html-type="submit">保存</a-button>
        </div>
      </div>
    </a-form>
  </a-modal>
</template>

<style scoped></style>
