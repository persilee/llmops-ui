<script setup lang="ts">
import WorkFlowApi from '@/services/api/workflow'
import { useVueFlow } from '@vue-flow/core'
import { computed, ref } from 'vue'
import { useWorkflowStore } from '../../Workflow.store'

const form = ref<Record<string, any>>({})
const store = useWorkflowStore()
const { nodes } = useVueFlow()
const loading = ref(false)

const inputs = computed(() => {
  const result: any[] = []
  store.runNode.data.inputs.forEach((item: any) => {
    if (item.value.type == 'ref') {
      result.push(item)
    }
  })

  return result
})

const onSubmit = async () => {
  try {
    if (store.workflow && store.workflow.id) {
      loading.value = true
      store.isNodeDebugRunning = true
      store.nodeDebugLoading = true
      store.nodeDebugVisible = false
      const resp = await WorkFlowApi.debugWorkflow({
        workflowId: store.workflow.id,
        req: { inputs: form.value, node_id: store.runNode.id },
        onData: async (event_response) => {
          const data = event_response?.data
          console.log('event_response', data)

          if (store.runNode.type == 'code') {
            store.codeNodeResult = data
          } else if (store.runNode.type == 'dataset_retrieval') {
            store.datasetRetrievalNodeResult = data
          } else if (store.runNode.type == 'llm') {
            store.llmNodeResult = data
          } else if (store.runNode.type == 'tool') {
            store.toolNodeResult = data
          } else if (store.runNode.type == 'http_request') {
            store.httpRequestNodeResult = data
          } else if (store.runNode.type == 'question_classifier') {
            store.questionClassifierNodeResult = data
          } else if (store.runNode.type == 'iteration') {
            store.iterationNodeResult = data
          } else if (store.runNode.type == 'template_transform') {
            store.templateTransformNodeResult = data
          }

          if (!data) return
        },
      })
    }
  } catch (error) {
  } finally {
    loading.value = false
    store.nodeDebugLoading = false
  }
}
</script>

<template>
  <div
    v-if="store.nodeDebugVisible"
    class="absolute right-0 top-0 bottom-0 w-[400px] min-w-[400px] p-2.5"
  >
    <div
      class="flex flex-col h-full bg-white z-50 p-4 border border-gray-100 shadow-lg rounded-lg relative"
      @click.stop
    >
      <!-- 调试面板标题 -->
      <div class="flex items-center justify-between mb-2">
        <!-- 左侧标题 -->
        <div class="text-base font-bold text-gray-700">{{ store.runNode.data.title }}调试</div>
        <!-- 右侧关闭按钮 -->
        <a-button
          type="text"
          size="mini"
          class="rounded-full"
          @click="store.nodeDebugVisible = false"
        >
          <template #icon>
            <icon-close class="text-gray-800 font-bold" />
          </template>
        </a-button>
      </div>
      <div class="mt-4">
        <a-form :model="form" layout="vertical" @submit="onSubmit" ref="formRef">
          <!-- 输入数据表单列表 -->
          <a-form-item
            v-for="(input, idx) in inputs"
            :key="idx"
            :field="input.name"
            :required="input.required"
            hide-asterisk
          >
            <template #label>
              <div class="flex items-center gap-2">
                <div class="">{{ input.name }}</div>
                <div v-if="input.required" class="text-red-700">*</div>
                <div class="text-xs text-gray-500 bg-gray-200 px-1 py-0.5 rounded flex-shrink-0">
                  {{ input.type }}
                </div>
              </div>
            </template>
            <a-input
              v-if="input.type === 'string'"
              v-model="form[input.name]"
              placeholder="请输入参考值"
              class="rounded-md"
            />
            <a-input-number
              v-else-if="['int', 'float'].includes(input.type)"
              v-model="form[input.name]"
              placeholder="请输入参考值"
              class="rounded-md"
            />
            <a-radio-group v-else-if="input.type === 'boolean'" v-model="form[input.name]">
              <a-radio :value="true">是</a-radio>
              <a-radio :value="false">否</a-radio>
            </a-radio-group>
            <!-- 功能升级:调试窗口新增列表型数据输入，使用普通文本框代替，格式为[xxx, xxx] -->
            <a-input-tag
              v-else-if="input.type.startsWith('list')"
              v-model="form[input.name]"
              placeholder="请输入参考值列表信息"
              class="!rounded-lg"
            />
          </a-form-item>
          <a-button :loading="loading" type="primary" long class="rounded-lg" html-type="submit">
            <template #icon>
              <icon-play-arrow-fill />
            </template>
            开始运行
          </a-button>
        </a-form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
