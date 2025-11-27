<script setup lang="ts">
import { ref } from 'vue'
import { useDatasetStore } from '../DatasetView.store'

const store = useDatasetStore()
const progress = ref(66)
const handleNextClick = () => {
  if (store.currentStep > 1) store.currentStep--
}
const handlePreviousClick = () => {
  if (store.currentStep < 3) store.currentStep++
}
</script>

<template>
  <div class="flex flex-col p-6 h-full">
    <!-- 返回按钮和标题 -->
    <div class="flex items-center mb-6 gap-4">
      <a-button size="mini" type="text" class="text-gray-700" @click="$router.back()">
        <template #icon><icon-left /></template>
      </a-button>
      <div class="text-lg font-bold text-gray-700">添加文件</div>
    </div>
    <!-- 步骤 -->
    <div class="w-[520px] mx-auto">
      <a-steps :current="store.currentStep">
        <a-step>上传</a-step>
        <a-step>分段设置</a-step>
        <a-step>数据处理</a-step>
      </a-steps>
    </div>
    <!-- 步骤内容 -->
    <div class="flex-1 p-[48px]">
      <!-- 上传 -->
      <div v-if="store.currentStep === 1" class="">
        <a-upload
          draggable
          accept=".doc, .docx, .pdf, .txt, .md, .markdown"
          :limit="10"
          multiple
          tip="支持PDF、TXT、DOC、DOCX、MD，最多可上传10个文件，每个文件不超过10MB"
        />
      </div>
      <!-- 分段设置 -->
      <div v-if="store.currentStep === 2" class="">
        <!-- 自动分段与清洗 -->
        <div class="px-5 py-4 mb-3 bg-white rounded-lg border border-blue-600 cursor-pointer">
          <div class="font-bold text-gray-700 mb-2">自动分段与清洗</div>
          <div class="text-gray-500 text-xs">自动分段与预处理规则</div>
        </div>
        <!-- 自定义 -->
        <div class="px-5 py-4 bg-white rounded-lg border border-blue-600 cursor-pointer">
          <div class="font-bold text-gray-700 mb-2">自定义</div>
          <div class="text-gray-500 text-xs">自定义分段规则、分段长度与预处理规则</div>
          <div class="">
            <a-divider />
            <a-form layout="vertical">
              <a-form-item field="separators" label="分段标识符" required asterisk-position="end">
                <a-input-tag
                  placeholder="请输入分段标识符，如果有多个标识符，请使用英文逗号进行分割"
                />
              </a-form-item>
              <a-form-item field="chunk_size" label="分段最大长度" required asterisk-position="end">
                <a-input-number
                  :min="100"
                  :max="1000"
                  :step="1"
                  :default-value="500"
                  placeholder="请输入100 - 1000的数值"
                />
              </a-form-item>
              <a-form-item field="chunk_overlap" label="块重叠数" required asterisk-position="end">
                <a-input-number
                  :min="0"
                  :max="500"
                  :step="1"
                  :default-value="50"
                  placeholder="请输入0 - 500的数值"
                />
              </a-form-item>
              <a-form-item label="文本预处理规则">
                <a-checkbox-group direction="vertical">
                  <a-checkbox value="remove_extra_space"
                    >替换掉连续的空格、换行符和制表符</a-checkbox
                  >
                  <a-checkbox value="remove_url_and_email">删除所有 URL 和电子邮件地址</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </a-form>
          </div>
        </div>
      </div>
      <!-- 数据处理 -->
      <div v-if="store.currentStep === 3" class="">
        <div class="text-gray-700 font-medium mb-2">服务器处理中</div>
        <div class="flex flex-col gap-2">
          <div class="bg-white rounded-lg border border-blue-600 relative">
            <!-- 进度 -->
            <div class="flex progress-bar rounded-lg" :style="{ width: progress + '%' }"></div>
            <!-- 数据处理内容 -->
            <div class="flex items-center justify-between px-4 py-3 z-10 relative">
              <div class="flex items-center gap-2.5">
                <a-avatar shape="square" class="bg-blue-700"><icon-file /></a-avatar>
                <div class="">
                  <div class="text-gray-700 mb-1.5">基于工具调用的智能体设计与实现.md</div>
                  <div class="text-gray-500 text-xs">15.63 KB</div>
                </div>
              </div>
              <div class="text-gray-500">{{ progress }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 操作按钮 -->
    <div class="flex items-center px-[48px] gap-4 justify-end">
      <a-button
        v-if="store.currentStep > 1"
        class="rounded-lg"
        size="small"
        @click="handleNextClick"
        >上一步</a-button
      >
      <a-button
        v-if="store.currentStep < 3"
        class="rounded-lg"
        size="small"
        type="primary"
        @click="handlePreviousClick"
        >下一步</a-button
      >
    </div>
  </div>
</template>

<style scoped>
:deep(.arco-upload-list-item-content) {
  background-color: #f3f4f6;
}
:deep(.arco-upload-drag) {
  background-color: #e5e7eb;
}
.progress-bar {
  position: absolute;
  background-color: #eff6ff !important;
  height: 100%;
  z-index: 0;
}
</style>
