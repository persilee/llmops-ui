import WorkFlowApi from '@/services/api/workflow'
import type { GetWorkflowsWithPage } from '@/services/api/workflow/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkflowStore = defineStore(
  'workflow',
  () => {
    const workflow = ref<GetWorkflowsWithPage>()
    const mode = ref('mouse')
    const isShowMap = ref(false)
    const loading = ref(false)
    const draftGraph = ref({
      nodes: <any[]>[],
      edges: <any[]>[],
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
              style: { fill: 'none' },
              type: 'custom',
            }
          }),
        }
      } catch (error) {}
    }

    const convertGraphToReq = (nodes: Record<string, any>[], edges: Record<string, any>[]) => {
      return {
        nodes: nodes.map((node) => {
          return {
            id: node.id,
            node_type: node.type,
            position: node.position,
            ...node.data,
          }
        }),
        edges: edges.map((edge) => {
          return {
            id: edge.id,
            source: edge.source,
            source_type: edge.source_type,
            target: edge.target,
            target_type: edge.target_type,
          }
        }),
      }
    }

    const updateDraftGraph = async (workflowId: string, req: Record<string, any>) => {
      try {
        loading.value = true
        const convertReq = convertGraphToReq(req.nodes, req.edges)
        await WorkFlowApi.updateDraftGraph(workflowId, convertReq)
        await getWorkflow(workflowId)
      } catch (error) {
      } finally {
        loading.value = false
      }
    }

    return {
      workflow,
      mode,
      isShowMap,
      draftGraph,
      loading,
      getWorkflow,
      getDraftGraph,
      updateDraftGraph,
    }
  },
  {
    persist: true,
  },
)
