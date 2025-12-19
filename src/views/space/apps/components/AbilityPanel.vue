<script setup lang="ts">
import DatasetsCollapse from './ability/DatasetsCollapse.vue'
import LongTermMemory from './ability/LongTermMemory.vue'
import OpeningStatement from './ability/OpeningStatement.vue'
import ReviewConfig from './ability/ReviewConfig.vue'
import SpeechToText from './ability/SpeechToText.vue'
import SuggestedAfterAnswer from './ability/SuggestedAfterAnswer.vue'
import TextToSpeech from './ability/TextToSpeech.vue'
import ToolsExpand from './ability/ToolsExpand.vue'
import WorkflowsCollapse from './ability/WorkflowsCollapse.vue'

const defaultActiveKey = [
  'LongTermMemory',
  'OpeningStatement',
  'ReviewConfig',
  'SuggestedAfterAnswer',
  'SpeechToText',
  'TextToSpeech',
  'Tools',
  'Datasets',
  'Workflows',
]
</script>

<template>
  <div class="flex-1 flex flex-col">
    <div class="flex items-center h-10 px-6 font-bold text-gray-900">应用能力</div>

    <div class="flex-1 overflow-y-scroll scrollbar-w-none" style="max-height: calc(100% - 118px)">
      <a-collapse :default-active-key="defaultActiveKey" :bordered="false">
        <!-- 扩展插件 -->
        <ToolsExpand />
        <!-- 工作流 -->
        <WorkflowsCollapse />
        <!-- 知识库 -->
        <DatasetsCollapse />
        <!-- 长期记忆 -->
        <LongTermMemory />
        <!-- 对话开场白 -->
        <OpeningStatement />
        <!-- 用户建议问题 -->
        <SuggestedAfterAnswer />
        <!-- 语音输入 -->
        <SpeechToText />
        <!-- 语音输出 -->
        <TextToSpeech />
        <!-- 内容审核 -->
        <ReviewConfig />
      </a-collapse>
    </div>
  </div>
</template>

<style scoped>
:deep(.arco-collapse-item-header, .arco-collapse-item-active > .arco-collapse-item-header) {
  background-color: transparent !important;
}

:deep(.arco-collapse-item-active > .arco-collapse-item-header) {
  border-color: transparent !important;
}
</style>
