<script setup lang="ts">
import { QueueEvent, RUNNING_THOUGHT_EVENTS, thoughtNameMap, thoughtShortNameMap } from '@/config'
import type { AgentThought } from '@/services/api/apps/types'
import { computed, type PropType, ref } from 'vue'

// 定义组件属性
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
    required: true,
  },
  agentThoughts: {
    type: Array as PropType<AgentThought[]>,
    default: () => [],
    required: true,
  },
})

// 控制运行过程详情的显示/隐藏状态
const visible = ref(false)

// 计算属性：过滤出正在运行的思考事件
const filteredThoughts = computed(() => {
  return props.agentThoughts.filter((item) => RUNNING_THOUGHT_EVENTS.includes(item.event))
})

// 计算属性：获取最后一个正在运行的思考事件
// 通过反转数组并查找第一个符合条件的事件来实现
const lastThought = computed(() => {
  return props.agentThoughts
    .slice() // 创建数组副本，避免修改原数组
    .reverse() // 反转数组，使最新的思考事件排在前面
    .find((item) => RUNNING_THOUGHT_EVENTS.includes(item.event)) // 查找第一个正在运行的思考事件
})

// 计算属性：判断最后一个思考事件是否为停止事件
// 通过检查数组最后一项的事件类型是否为 QueueEvent.stop 来确定
const isStopThought = computed(() => {
  const lastItem = props.agentThoughts[props.agentThoughts.length - 1]
  return lastItem?.event === QueueEvent.stop
})

// 计算属性：生成运行过程的摘要文本
const thoughtSummaryText = computed(() => {
  // 获取过滤后的思考事件列表
  const thoughts = filteredThoughts.value
  // 创建文本数组，用于存储每个思考事件的描述
  const text: Array<string> = []
  // 初始化总延迟时间
  let totalLatency = 0

  // 遍历所有思考事件
  thoughts.forEach((item) => {
    // 累加每个事件的延迟时间
    totalLatency += item.latency
    // 为每个事件生成描述文本，包含事件短名称和延迟时间
    text.push(`${getThoughtShortName(item.event)} ${item.latency.toFixed(2)}s`)
  })

  // 返回格式化的摘要文本，包含总延迟时间和各个事件的详细信息
  return `运行完毕 ${totalLatency.toFixed(2)}s (${text.join('｜')})`
})

// 计算属性：获取当前正在运行的思考事件的名称
// 依赖于 lastThought 计算属性，如果存在最后一个思考事件，则返回其对应的事件名称
const runningThoughtName = computed(() => {
  return lastThought.value ? getThoughtName(lastThought.value.event) : ''
})

/**
 * 获取思考事件的完整名称
 * @param thoughtName 思考事件的键名，类型为thoughtNameMap的键
 * @returns 返回对应的中文名称，如果不存在则返回空字符串
 */
const getThoughtName = (thoughtName: keyof typeof thoughtNameMap): string => {
  return thoughtNameMap[thoughtName] ?? ''
}

/**
 * 获取思考事件的短名称
 * @param thoughtName 思考事件的键名，类型为thoughtShortNameMap的键
 * @returns 返回对应的短名称，如果不存在则返回空字符串
 */
const getThoughtShortName = (thoughtName: keyof typeof thoughtShortNameMap): string => {
  return thoughtShortNameMap[thoughtName] ?? ''
}
</script>

<template>
  <!-- 智能体推理步骤 -->
  <div
    :class="`flex flex-col rounded-lg  max-w-full ${visible ? 'w-fit min-w-[220px]' : 'w-[180px]'}`"
  >
    <div
      :class="`flex items-center justify-between h-10 rounded-lg bg-gray-100 border border-gray-200 px-4 text-gray-700 cursor-pointer w-auto ${visible ? 'rounded-bl-none rounded-br-none' : ''}`"
      @click="visible = !visible"
    >
      <!-- 左侧图标与标题 -->
      <div v-if="visible" class="flex items-center gap-2">
        <icon-list />
        隐藏运行过程
      </div>
      <div v-else>
        <div v-if="loading" class="flex items-center gap-2 text-blue-600">
          <icon-loading />
          {{ runningThoughtName }}
        </div>
        <div v-else>
          <div v-if="isStopThought" class="flex items-center gap-2 text-gray-400">
            <icon-info-circle />
            运行中止
          </div>
          <div v-else class="flex items-center gap-2 text-[#00b23c]">
            <icon-check-circle />
            运行完毕
          </div>
        </div>
      </div>
      <!-- 右侧图标 -->
      <div>
        <icon-down
          :class="`${visible ? 'rotate-180 text-gray-600' : loading ? 'text-blue-600' : isStopThought ? 'text-gray-400' : 'text-[#00b23c]'} transition duration-160`"
        />
      </div>
    </div>

    <!-- 底部内容 -->
    <a-collapse
      class="agent-thought rounded-t-none border border-gray-200 border-t-0 overflow-hidden"
      v-if="visible"
      destroy-on-hide
      :bordered="false"
    >
      <a-collapse-item v-for="agentThought in filteredThoughts" :key="agentThought.id">
        <template #expand-icon>
          <icon-file v-if="agentThought.event === QueueEvent.longTermMemoryRecall" />
          <icon-robot-add v-else-if="agentThought.event === QueueEvent.agentThought" />
          <icon-storage v-else-if="agentThought.event === QueueEvent.datasetRetrieval" />
          <icon-tool v-else-if="agentThought.event === QueueEvent.agentAction" />
          <icon-message v-else-if="agentThought.event === QueueEvent.agentMessage" />
        </template>
        <template #header>
          <div class="text-gray-700">
            {{ getThoughtName(agentThought.event) }}
          </div>
        </template>
        <template #extra>
          <div class="text-gray-500">{{ agentThought.latency.toFixed(2) }}s</div>
        </template>
        <div
          v-if="['agent_thought', 'agent_message'].includes(agentThought.event)"
          class="text-xs text-gray-500 line-clamp-4 break-all"
        >
          {{ agentThought.thought || '-' }}
        </div>
        <div v-else class="text-xs text-gray-500 line-clamp-4 break-all">
          {{ agentThought.observation || '-' }}
        </div>
      </a-collapse-item>

      <div class="py-1.5 px-3 bg-gray-100">
        <span v-if="isStopThought" class="text-xs text-gray-500 px-2 py-1 rounded-sm bg-gray-200">
          运行中止
        </span>
        <div
          v-else
          class="text-xs text-[#00b23c] px-2 rounded-sm bg-[#69d18c4d] align-top leading-6"
        >
          {{ thoughtSummaryText }}
        </div>
      </div>
    </a-collapse>
  </div>
</template>

<style scoped>
:deep(.arco-collapse-item-header, .arco-collapse-item-active > .arco-collapse-item-header) {
  background-color: #f3f4f6 !important;
}
:deep(.arco-collapse-item-active > .arco-collapse-item-content) {
  padding-left: 13px !important;
}
</style>
