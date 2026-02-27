<script setup lang="ts">
import CodeEditor from '@/views/components/CodeEditor.vue'
import { isEmpty } from 'lodash-es'

const props = defineProps<{
  nodeResult: any
  loading: boolean
}>()
</script>

<template>
  <a-tab-pane key="running" title="运行结果">
    <!-- 运行中的状态 -->
    <div
      v-if="loading"
      class="flex flex-col gap-2 bg-green-100 rounded-lg border border-green-500 p-3 mb-2"
    >
      <!-- 加载状态 -->
      <div class="flex items-center gap-2">
        <icon-loading class="text-green-500" />
        <div class="text-green-500">节点运行中</div>
      </div>
    </div>
    <!-- 非运行时状态 -->
    <div v-else class="flex flex-col gap-2">
      <div v-if="!isEmpty(nodeResult)">
        <!-- 运行失败UI -->
        <div
          v-if="nodeResult.status === 'failed'"
          class="flex flex-col gap-2 bg-red-100 p-3 rounded-lg border border-red-700"
        >
          <div class="flex items-center gap-2 text-red-500">
            <icon-exclamation-circle-fill />
            <div>工作流运行失败</div>
          </div>
          <div class="text-xs text-gray-500">{{ nodeResult.error ?? '' }}</div>
        </div>
        <div v-else>
          <!-- 运行成功UI -->
          <div class="flex flex-col gap-2 bg-green-100 p-3 rounded-lg border border-green-600">
            <!-- 数据统计 -->
            <div class="flex items-center gap-2 text-xs">
              <div class="flex-1 flex flex-col gap-1">
                <div class="text-gray-500">状态</div>
                <div class="flex items-center gap-1">
                  <icon-check-circle-fill class="text-xs text-green-600" />
                  <div class="font-semibold text-green-600">运行成功</div>
                </div>
              </div>
              <div class="flex-1 flex flex-col gap-1">
                <div class="text-gray-500">总消耗</div>
                <div class="text-gray-700 font-medium">0 Tokens</div>
              </div>
              <div class="flex-1 flex flex-col gap-1">
                <div class="text-gray-500">总用时</div>
                <div class="text-gray-700 font-medium">
                  {{ nodeResult.node_results[0].latency?.toFixed(2) }}s
                </div>
              </div>
            </div>
          </div>
          <!-- 运行结果 -->
          <CodeEditor
            :code="
              nodeResult.node_results[0].inputs
                ? JSON.stringify(nodeResult.node_results[0].inputs, null, 2)
                : '{}'
            "
            :height="200"
            class="rounded-lg overflow-hidden mt-4"
            language-name="输入"
            language="json"
            :options="{ readOnly: true }"
            :is-plaintext="true"
          />
          <CodeEditor
            :code="
              nodeResult.node_results[0].outputs
                ? JSON.stringify(nodeResult.node_results[0].outputs, null, 2)
                : '{}'
            "
            :height="200"
            class="rounded-lg overflow-hidden mt-4"
            language-name="输出"
            language="json"
            :options="{ readOnly: true }"
            :is-plaintext="true"
          />
        </div>
      </div>
      <!-- 空数据状态 -->
      <a-empty v-if="isEmpty(nodeResult) && !loading" class="mt-8"> 该节点暂无运行结果 </a-empty>
    </div>
  </a-tab-pane>
</template>

<style scoped></style>
