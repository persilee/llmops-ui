import WorkFlowApi from '@/services/api/workflow'
import type { GetWorkflowsWithPage } from '@/services/api/workflow/types'
import type { Edge, Node } from '@vue-flow/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkflowStore = defineStore(
  'workflow',
  () => {
    const workflow = ref<GetWorkflowsWithPage & { mode?: string; isShowMap?: boolean }>({
      mode: 'mouse',
      isShowMap: false,
    })
    const loading = ref(false)
    const draftGraph = ref({
      nodes: <Node[]>[],
      edges: <Edge[]>[],
    })

    const getWorkflow = async (workflowId: string) => {
      try {
        const resp = await WorkFlowApi.getWorkflow(workflowId)
        workflow.value = resp.data
      } catch (error) {}
    }

    const getDraftGraph = async (workflowId: string) => {
      try {
        const resp = await WorkFlowApi.getDraftGraph(workflowId)
        draftGraph.value = {
          nodes: resp.data.nodes.map((node) => {
            const { id, node_type: type, position, ...data } = node
            return { id, type, position, data }
          }),
          edges: resp.data.edges.map((edge) => {
            return {
              ...edge,
              animated: true,
              style: { strokeWidth: 2, stroke: '#9ca3af' },
            }
          }),
        }
      } catch (error) {}
    }

    return {
      workflow,
      draftGraph,
      loading,
      getWorkflow,
      getDraftGraph,
    }
  },
  {
    persist: true,
  },
)
