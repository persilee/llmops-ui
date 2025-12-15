<script setup lang="ts">
import type { ReviewConfig } from '@/services/api/apps/types'
import { Message } from '@arco-design/web-vue'
import * as _ from 'lodash-es'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '../../AppView.store'

// 获取应用状态管理store实例
const store = useAppStore()
// 定义模态框的显示状态，使用v-model绑定
const visible = defineModel('visible', { type: Boolean, default: false })
// 控制更新操作的加载状态，用于显示加载中效果
const updateLoading = ref(false)
// 表单数据对象，包含审核配置的所有字段
const formData = ref<ReviewConfig>({
  // 是否启用内容审核
  enable: false,
  // 敏感关键词列表
  keywords: [],
  // 输入内容审核配置
  inputs_config: {
    // 是否启用输入内容审核
    enable: false,
    // 触发审核时的预设回复内容
    preset_response: '',
  },
  // 输出内容审核配置
  outputs_config: {
    // 是否启用输出内容审核
    enable: false,
  },
})

/**
 * 关键词计算属性
 * 用于处理关键词的显示和存储格式转换
 * - getter: 将数组形式的关键词转换为换行符分隔的字符串，用于在文本框中显示
 * - setter: 将用户输入的换行符分隔的字符串转换回数组，用于存储到formData中
 */
const keywords = computed({
  get: () => formData.value.keywords?.join('\n'),
  set: (val) => (formData.value.keywords = val?.split('\n')),
})

/**
 * 计算有效关键词的数量
 * @param val - 包含关键词的字符串，使用换行符分隔
 * @returns {number} - 去除空行后的关键词数量
 */
const wordLength = (val: string) => {
  return _.compact(val.split('\n')).length
}

/**
 * 关闭模态框
 * 将 visible 的值设置为 false，从而关闭模态框
 */
const handleCloseModal = () => {
  visible.value = false
}

/**
 * 处理表单提交的异步函数
 * 用于更新应用的审核配置
 *
 * @returns {Promise<void>}
 */
const handleSubmit = async () => {
  // 检查表单数据是否与原始配置相同，如果相同则无需更新
  if (_.isEqual(formData.value, store.draftAppConfig.review_config)) return
  try {
    // 设置加载状态为true，显示加载中效果
    updateLoading.value = true
    // 调用store中的更新配置方法，传入新的审核配置
    const resp = await store.updateDraftAppConfig({ review_config: formData.value })
    // 更新成功后关闭模态框
    handleCloseModal()
    // 如果响应中包含消息，则显示成功提示
    if (resp) Message.success(resp.message)
  } catch (error) {
    // 错误处理：可以在这里添加错误提示逻辑
  } finally {
    // 无论成功失败，最后都要重置加载状态
    updateLoading.value = false
  }
}

// 监听模态框的显示状态
const stop = watch(visible, (val) => {
  // 当模态框打开时，从store中克隆审核配置数据到表单数据中
  if (val) {
    formData.value = _.cloneDeep(store.draftAppConfig.review_config)
  }
})

onUnmounted(() => {
  // 组件卸载时，停止监听
  stop()
})
</script>

<template>
  <div class="">
    <a-modal
      :visible="visible"
      :width="600"
      title="内容审核"
      title-align="start"
      :footer="false"
      modal-class="rounded-xl"
      @cancel="handleCloseModal"
    >
      <!-- form 表单 -->
      <div class="flex flex-col">
        <a-form :model="formData" @submit="handleSubmit" layout="vertical">
          <!-- 关键字 -->
          <a-form-item
            field="keywords"
            asterisk-position="end"
            :rules="[{ required: true, message: '关键词不能为空' }]"
            label="关键词"
          >
            <div class="flex flex-col w-full">
              <div class="text-xs text-gray-500 mb-2.5">
                每行一个，用换行符分割。最多填写100个关键词
              </div>
              <a-textarea
                v-model="keywords"
                placeholder="每行一个，用换行符分隔"
                :auto-size="{ minRows: 4, maxRows: 4 }"
                :max-length="100"
                :word-length="wordLength"
                show-word-limit
                class="bg-white border-gray-300 rounded-lg focus-within:border-blue-600"
              ></a-textarea>
            </div>
          </a-form-item>
          <!-- 审查输入内容 -->
          <div class="px-3 bg-gray-50 border border-gray-300 rounded-lg">
            <a-form-item field="inputs_config">
              <div class="flex flex-col w-full">
                <div class="flex items-center justify-between w-full">
                  <div class="text-[#4e5969]">审查输入内容</div>
                  <a-switch v-model="formData.inputs_config.enable" type="round" size="small" />
                </div>
                <div class="text-xs text-gray-500 my-2">预设回复</div>
                <a-textarea
                  v-model="formData.inputs_config.preset_response"
                  placeholder="每行一个，用换行符分隔"
                  :auto-size="{ minRows: 3, maxRows: 3 }"
                  class="bg-white border-gray-300 rounded-lg focus-within:border-blue-600"
                ></a-textarea>
              </div>
            </a-form-item>
          </div>
          <!-- 审查输出内容 -->
          <div class="pb-2 px-3 bg-gray-50 border border-gray-300 rounded-lg mt-5">
            <a-form-item field="inputs_config" class="m-0">
              <div class="flex items-center justify-between w-full">
                <div class="text-[#4e5969]">审查输出内容</div>
                <a-switch
                  v-model="formData.outputs_config.enable"
                  type="round"
                  size="small"
                  class="inline-block"
                />
              </div>
            </a-form-item>
          </div>
          <!-- 底部按钮 -->
          <div class="flex justify-end mt-4">
            <a-button
              type="outline"
              class="border-gray-300 text-gray-500 mr-3"
              @click="handleCloseModal"
              >取消</a-button
            >
            <a-button :loading="updateLoading" type="primary" class="" html-type="submit"
              >保存</a-button
            >
          </div>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<style scoped></style>
