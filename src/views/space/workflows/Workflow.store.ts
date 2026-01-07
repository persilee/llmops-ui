import WorkFlowApi from '@/services/api/workflow'
import type { GetWorkflowsWithPage } from '@/services/api/workflow/types'
import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'
import CodeNode from './components/nodes/CodeNode.vue'
import DatasetRetrievalNode from './components/nodes/DatasetRetrievalNode.vue'
import EndNode from './components/nodes/EndNode.vue'
import HttpRequestNode from './components/nodes/HttpRequestNode.vue'
import IterationNode from './components/nodes/IterationNode.vue'
import LLMNode from './components/nodes/LLMNode.vue'
import QuestionClassifierNode from './components/nodes/QuestionClassifierNode.vue'
import StartNode from './components/nodes/StartNode.vue'
import TemplateTransformNode from './components/nodes/TemplateTransformNode.vue'
import ToolNode from './components/nodes/ToolNode.vue'

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

    const NOTE_TYPES = {
      start: markRaw(StartNode),
      llm: markRaw(LLMNode),
      tool: markRaw(ToolNode),
      dataset_retrieval: markRaw(DatasetRetrievalNode),
      template_transform: markRaw(TemplateTransformNode),
      http_request: markRaw(HttpRequestNode),
      code: markRaw(CodeNode),
      question_classifier: markRaw(QuestionClassifierNode),
      iteration: markRaw(IterationNode),
      end: markRaw(EndNode),
    }

    const NODE_DATA_MAP: Record<string, any> = {
      start: {
        title: '开始节点',
        description: '工作流的起点节点，支持定义工作流的起点输入等信息',
        inputs: [],
      },
      llm: {
        title: '大语言模型',
        description: '调用大语言模型，根据输入参数和提示词生成回复。',
        prompt: '',
        language_model_config: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          parameters: {
            frequency_penalty: 0.2,
            max_tokens: 8192,
            presence_penalty: 0.2,
            temperature: 0.5,
            top_p: 0.85,
          },
        },
        inputs: [],
        outputs: [{ name: 'output', type: 'string', value: { type: 'generated', content: '' } }],
      },
      tool: {
        title: '扩展插件',
        description: '调用插件广场或自定义API插件，支持能力扩展和复用',
        tool_type: '',
        provider_id: '',
        tool_id: '',
        params: {},
        inputs: [],
        outputs: [{ name: 'text', type: 'string', value: { type: 'generated', content: '' } }],
        meta: {
          type: 'api_tool',
          provider: { id: '', name: '', label: '', icon: '', description: '' },
          tool: { id: '', name: '', label: '', description: '', params: {} },
        },
      },
      dataset_retrieval: {
        title: '知识库检索',
        description: '根据输入的参数，在选定的知识库中检索相关片段并召回，返回切片列表',
        dataset_ids: [],
        retrieval_config: {
          retrieval_strategy: 'semantic',
          k: 4,
          score: 0,
        },
        inputs: [
          {
            name: 'query',
            type: 'string',
            value: { type: 'ref', content: { ref_node_id: '', ref_var_name: '' } },
          },
        ],
        outputs: [
          { name: 'combine_documents', type: 'string', value: { type: 'generated', content: '' } },
        ],
        meta: { datasets: [] },
      },
      template_transform: {
        title: '模板转换',
        description: '对多个字符串变量的格式进行处理',
        template: '',
        inputs: [],
        outputs: [{ name: 'output', type: 'string', value: { type: 'generated', content: '' } }],
      },
      http_request: {
        title: 'HTTP请求',
        description: '配置外部API服务，并发起请求。',
        url: '',
        method: 'get',
        inputs: [],
        outputs: [
          { name: 'status_code', type: 'int', value: { type: 'generated', content: 0 } },
          { name: 'text', type: 'string', value: { type: 'generated', content: '' } },
        ],
      },
      code: {
        title: 'Python代码执行',
        description: '编写代码，处理输入输出变量来生成返回值',
        code: '',
        inputs: [],
        outputs: [],
      },
      question_classifier: {
        title: '意图识别',
        description: '定义用户问题的分类条件，LLM能够根据分类描述执行不同的分支。',
        classes: [],
        inputs: [
          {
            name: 'query',
            type: 'string',
            value: { type: 'ref', content: { ref_node_id: '', ref_var_name: '' } },
          },
        ],
        outputs: [],
      },
      iteration: {
        title: '迭代节点',
        description: '传递一个列表型数据，并引用一个工作流完成多轮迭代得到处理后的列表数据',
        workflow_ids: [],
        inputs: [
          {
            name: 'inputs',
            type: 'list[string]',
            value: { type: 'ref', content: { ref_node_id: '', ref_var_name: '' } },
          },
        ],
        outputs: [
          { name: 'outputs', type: 'list[string]', value: { type: 'generated', content: '' } },
        ],
        meta: { workflows: [] },
      },
      end: {
        title: '结束节点',
        description: '工作流的结束节点，支持定义工作流最终输出的变量等信息',
        outputs: [],
      },
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
      NODE_DATA_MAP,
      NOTE_TYPES,
    }
  },
  {
    persist: true,
  },
)
