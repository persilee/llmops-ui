<script setup lang="ts">
import WorkFlowApi from '@/services/api/workflow'
import type { GetWorkflowResp } from '@/services/api/workflow/types'
import { copyToClipboard, typeMap } from '@/utils/util'
import { ref } from 'vue'
import { useAppStore } from '../../AppView.store'
import WorkflowDrawer from './WorkflowDrawer.vue'

const store = useAppStore()
const loading = ref(false)
const visible = ref(false)
const infoLoading = ref(false)
const workflowInfo = ref<GetWorkflowResp>()
const inputsInfo = ref<any>({})

const handleAddWorkflow = () => {
  visible.value = true
}

const getWorkflowInfo = async (visible: boolean, workflow: any) => {
  if (!visible) return

  try {
    infoLoading.value = true
    const resp = await WorkFlowApi.getWorkflow(workflow.id)
    workflowInfo.value = resp.data
    workflowInfo.value.graph.nodes.forEach((node: any) => {
      if (node.node_type == 'start') {
        inputsInfo.value = node.inputs
      }
    })
  } catch (error) {
  } finally {
    infoLoading.value = false
  }
}
</script>

<template>
  <a-collapse-item header="工作流" key="Workflows">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <a-tooltip content="添加工作流">
        <a-button type="text" size="mini" @click.stop="handleAddWorkflow">
          <template #icon>
            <icon-plus class="text-gray-500" />
          </template>
        </a-button>
      </a-tooltip>
    </template>
    <!-- 内容 -->
    <a-spin :loading="loading" class="w-full h-full">
      <div v-if="store.draftAppConfig.workflows.length > 0" class="flex flex-col gap-2">
        <div
          v-for="(workflow, idx) in store.draftAppConfig.workflows"
          :key="idx"
          class="flex items-center bg-white hover:bg-gray-200 p-2 rounded-lg transition-all duration-200 group"
        >
          <a-avatar :size="26" shape="square" class="bg-transparent">
            <img :src="workflow.icon" />
          </a-avatar>
          <div class="flex-1 ml-2 flex flex-col justify-between">
            <span class="font-bold text-gray-900">{{ workflow.name }}</span>
            <span class="text-xs text-gray-500">{{ workflow.description }}</span>
          </div>
          <a-popover
            @popup-visible-change="(visible: boolean) => getWorkflowInfo(visible, workflow)"
          >
            <template #content>
              <a-spin :loading="infoLoading" class="">
                <div class="flex flex-col gap-2 max-w-[300px]">
                  <div class="text-gray-700 font-semibold">
                    {{ workflowInfo?.name }}
                  </div>
                  <div class="text-gray-600 text-xs">
                    {{ workflowInfo?.description }} · {{ workflowInfo?.node_count }}节点
                  </div>
                  <div class="flex items-center gap-2 my-0.5">
                    <div class="text-[10px] text-gray-500 font-semibold">输入参数</div>
                    <hr class="flex-1 border-gray-200" />
                  </div>
                  <div
                    v-for="(input, iIndex) in inputsInfo"
                    :key="iIndex"
                    class="flex flex-col gap-1"
                  >
                    <div class="flex items-center gap-1.5">
                      <div class="font-bold text-gray-800">{{ input.name }}</div>
                      <div class="text-xs text-gray-600">
                        {{ typeMap[input.type] }}
                      </div>
                      <div v-if="input.required" class="text-xs text-yellow-600">必填</div>
                    </div>
                    <div class="text-gray-600 text-xs">{{ input.description }}</div>
                  </div>
                </div>
              </a-spin>
            </template>
            <a-button
              type="text"
              size="mini"
              class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
            >
              <template #icon><icon-info-circle class="text-gray-500" /></template>
            </a-button>
          </a-popover>
          <a-tooltip content="复制名称">
            <a-button
              type="text"
              size="mini"
              class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
              @click="copyToClipboard(workflow.name)"
            >
              <template #icon><icon-copy class="text-gray-500" /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip content="移除知识库">
            <a-button
              type="text"
              size="mini"
              class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
              @click="store.removeDataset(workflow.id)"
            >
              <template #icon><icon-delete class="text-gray-500" /></template>
            </a-button>
          </a-tooltip>
        </div>
      </div>
      <div v-else class="text-gray-500">
        工作流支持通过可视化的方式，对插件、大语言模型、代码块等功能进行组合，从而实现复杂、稳定的业务流程编排，例如旅行规划、报告分析等。
      </div>
    </a-spin>
    <WorkflowDrawer v-model:visible="visible" />
  </a-collapse-item>
</template>

<style scoped></style>
