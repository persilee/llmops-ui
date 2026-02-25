<script setup lang="ts">
import WorkFlowApi from '@/services/api/workflow'
import { useVueFlow, type NodeProps } from '@vue-flow/core'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkflowStore } from '../../Workflow.store'

const props = defineProps<{
  node: NodeProps
}>()
const nodeResult = defineModel('nodeResult', { type: Object })
const emits = defineEmits(['debugNode', 'renameNode'])
const { removeNodes, updateNode } = useVueFlow()
const localTitle = ref(props.node.data.title)
const isReName = ref(false)
const route = useRoute()
const store = useWorkflowStore()
const inputRef = ref<HTMLInputElement | null>(null)

const handleSelect = async (v: string) => {
  if (v == 'rename') {
    isReName.value = true
    setTimeout(() => {
      inputRef.value?.focus()
    }, 100)
  }

  if (v == 'delete') {
    removeNodes([props.node.id])
  }
}

const handleBlur = () => {
  updateNode(props.node.id, {
    data: {
      ...props.node.data,
      title: localTitle.value,
    },
  })
  isReName.value = false
  store.updateDraftGraph(route.params.workflowId as string, {
    edges: store.draftGraph.edges,
    nodes: store.draftGraph.nodes,
  })
}

const handleDebugNode = async () => {
  try {
    if (store.workflow && store.workflow.id) {
      nodeResult.value = {}
      const resp = await WorkFlowApi.debugWorkflow({
        workflowId: store.workflow.id,
        req: { inputs: props.node.data.inputs, node_id: props.node.id },
        onData: async (event_response) => {
          const data = event_response?.data
          console.log('data', data)

          nodeResult.value = data.node_results[0]
          if (!data) return
        },
      })
    }
  } catch (error) {}
}
</script>

<template>
  <div class="flex items-center justify-between mb-1">
    <div class="flex items-center gap-2">
      <slot></slot>
      <a-input
        ref="inputRef"
        v-if="isReName"
        v-model="localTitle"
        placeholder="请输入节点名称"
        class="z-10"
        @blur="handleBlur"
        @click.stop
      />
      <div v-else class="text-gray-700 font-semibold">{{ node.data?.title }}</div>
    </div>
    <div class="flex items-center gap-0.5">
      <a-tooltip content="测试该节点">
        <a-button type="text" size="small" @click.stop="handleDebugNode">
          <template #icon>
            <icon-play-arrow-fill class="text-gray-500 text-[22px]" />
          </template>
        </a-button>
      </a-tooltip>
      <a-dropdown position="br" trigger="hover" @select="handleSelect">
        <a-button @click.stop type="text" size="small">
          <template #icon>
            <icon-more class="text-gray-500 text-base" />
          </template>
        </a-button>
        <template #content>
          <a-doption value="rename">重命名</a-doption>
          <a-doption value="delete" class="text-red-500">删除</a-doption>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<style scoped></style>
