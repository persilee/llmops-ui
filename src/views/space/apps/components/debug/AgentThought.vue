<script setup lang="ts">
import { QueueEvent, RUNNING_THOUGHT_EVENTS, thoughtNameMap, thoughtShortNameMap } from '@/config'
import { type PropType, ref } from 'vue'

// 定义自定义组件所需数据
const props = defineProps({
  loading: { type: Boolean, default: false, required: true },
  agentThoughts: {
    type: Array as PropType<Record<string, any>[]>,
    default: () => [],
    required: true,
  },
})
const visible = ref(false)

const getThoughtName = (thoughtName: keyof typeof thoughtNameMap): string => {
  return thoughtNameMap[thoughtName] ?? ''
}

const getThoughtShortName = (thoughtName: keyof typeof thoughtShortNameMap): string => {
  return thoughtShortNameMap[thoughtName] ?? ''
}

const getRunningThoughtName = (): string => {
  const lastThought = props.agentThoughts
    ?.slice()
    .reverse()
    .find((item: any) => RUNNING_THOUGHT_EVENTS.includes(item.event))

  return lastThought ? getThoughtName(lastThought.event) : ''
}

const isStopThought = () => {
  return props.agentThoughts[props.agentThoughts.length - 1]?.event === QueueEvent.stop
}

const getThoughtSummaryText = () => {
  const thoughts = props.agentThoughts.filter((item: any) =>
    RUNNING_THOUGHT_EVENTS.includes(item.event),
  )
  const text: Array<string> = []
  let totalLatency = 0
  thoughts.forEach((item: any) => {
    totalLatency += item.latency
    text.push(`${getThoughtShortName(item.event)} ${item.latency.toFixed(2)}s`)
  })

  return `运行完毕 ${totalLatency.toFixed(2)}s (${text.join('｜')})`
}
</script>

<template>
  <!-- 智能体推理步骤 -->
  <div :class="`flex flex-col rounded-lg min-w-0 max-w-full ${visible ? 'w-fit' : 'w-[180px]'}`">
    <div
      :class="`flex items-center justify-between h-10 rounded-lg bg-gray-100 border border-gray-200 px-4 text-gray-700 cursor-pointer w-auto ${visible ? 'rounded-bl-none rounded-br-none' : ''}`"
      @click="visible = !visible"
    >
      <!-- 左侧图标与标题 -->
      <div v-if="visible" class="flex items-center gap-2">
        <icon-list />
        隐藏运行过程
      </div>
      <div v-else class="">
        <div v-if="loading" class="flex items-center gap-2 text-blue-600">
          <icon-loading />
          {{ getRunningThoughtName() }}
        </div>
        <div v-else class="">
          <div v-if="isStopThought()" class="flex items-center gap-2 text-gray-400">
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
      <div class="">
        <icon-down
          :class="`${visible ? 'rotate-180 text-gray-600' : loading ? 'text-blue-600' : isStopThought() ? 'text-gray-400' : 'text-[#00b23c]'} transition duration-160`"
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
      <a-collapse-item
        v-for="agent_thought in props.agentThoughts.filter((item: any) =>
          RUNNING_THOUGHT_EVENTS.includes(item.event),
        )"
        :key="agent_thought.id"
      >
        <template #expand-icon>
          <icon-file v-if="agent_thought.event === QueueEvent.longTermMemoryRecall" />
          <icon-robot-add v-else-if="agent_thought.event === QueueEvent.agentThought" />
          <icon-storage v-else-if="agent_thought.event === QueueEvent.datasetRetrieval" />
          <icon-tool v-else-if="agent_thought.event === QueueEvent.agentAction" />
          <icon-message v-else-if="agent_thought.event === QueueEvent.agentMessage" />
        </template>
        <template #header>
          <div class="text-gray-700">
            {{ getThoughtName(agent_thought.event) }}
          </div>
        </template>
        <template #extra>
          <div class="text-gray-500">{{ agent_thought.latency.toFixed(2) }}s</div>
        </template>
        <div
          v-if="['agent_thought', 'agent_message'].includes(agent_thought.event)"
          class="text-xs text-gray-500 line-clamp-4 break-all"
        >
          {{ agent_thought.thought || '-' }}
        </div>
        <div v-else class="text-xs text-gray-500 line-clamp-4 break-all">
          {{ agent_thought.observation || '-' }}
        </div>
      </a-collapse-item>
      <div class="py-1.5 px-3 bg-gray-100">
        <span v-if="isStopThought()" class="text-xs text-gray-500 px-2 py-1 rounded-sm bg-gray-200">
          运行中止
        </span>
        <div
          v-else
          class="text-xs text-[#00b23c] px-2 rounded-sm bg-[#69d18c4d] align-top leading-6"
        >
          {{ getThoughtSummaryText() }}
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
