import WorkFlowApi from '@/services/api/workflow'
import type { GetWorkflowsWithPage } from '@/services/api/workflow/types'
import type { GraphEdge, GraphNode } from '@vue-flow/core'
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
              style: { fill: 'none', strokeWidth: 2, stroke: '#9ca3af' },
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

    /**
     * 构建图的逆邻接表
     * @param edges 图的边集合，每条边包含源节点和目标节点信息
     * @returns 返回一个Map，其中key是节点ID，value是该节点的所有前置节点ID数组
     */
    const buildReverseAdjList = (edges: GraphEdge[]): Map<string, string[]> => {
      // 初始化逆邻接表，用于存储每个节点的所有前置节点
      const reverseAdjList = new Map<string, string[]>()

      // 遍历所有边，构建逆邻接关系
      edges.forEach((edge) => {
        // 如果目标节点还未在逆邻接表中，则初始化其前置节点数组
        if (!reverseAdjList.has(edge.target)) {
          reverseAdjList.set(edge.target, [])
        }
        // 将当前边的源节点添加到目标节点的前置节点列表中
        reverseAdjList.get(edge.target)?.push(edge.source)
      })

      return reverseAdjList
    }

    /**
     * 获取指定节点的所有前置节点
     * @param reverseAdjList 图的逆邻接表，key为节点ID，value为该节点的所有前置节点ID数组
     * @param targetNodeId 目标节点ID
     * @returns 返回目标节点的所有前置节点ID数组
     */
    const getPredecessorsByNodeId = (
      reverseAdjList: Map<string, string[]>,
      targetNodeId: string,
    ): string[] => {
      // 创建一个Set集合，用于记录已经访问过的节点，避免重复访问和循环
      const visited = new Set<string>()

      // 创建一个数组，用于存储找到的所有前置节点
      const predecessors: string[] = []

      /**
       * 深度优先搜索函数，用于递归遍历节点
       * @param nodeId 当前正在访问的节点ID
       */
      const dfs = (nodeId: string): void => {
        // 如果当前节点未被访问过
        if (!visited.has(nodeId)) {
          // 将当前节点标记为已访问
          visited.add(nodeId)

          // 如果当前节点不是目标节点，则将其添加到前置节点列表中
          if (nodeId !== targetNodeId) {
            predecessors.push(nodeId)
          }

          // 获取当前节点的所有前置节点（即逆邻接表中的邻居节点）
          const neighbors = reverseAdjList.get(nodeId) || []
          // 递归访问每个前置节点
          neighbors.forEach((neighbor) => {
            dfs(neighbor)
          })
        }
      }

      // 从目标节点开始，启动深度优先搜索
      dfs(targetNodeId)

      // 返回找到的所有前置节点
      return predecessors
    }

    /**
     * 获取工作流中可引用的变量列表
     * @param nodes 工作流中的所有节点
     * @param edges 工作流中的所有边
     * @param target_node_id 目标节点ID，需要获取该节点可引用的前置节点变量
     * @returns 返回一个数组，包含所有可引用的变量信息，每个元素代表一个节点的变量组
     *          格式为：[{ isGroup: boolean, label: string, options: Array }]
     */
    const getReferencedVariables = (
      nodes: GraphNode[],
      edges: GraphEdge[],
      target_node_id: string,
    ): Record<string, any>[] => {
      // 构建逆邻接表，用于快速查找节点的前置节点
      const reverseAdjList = buildReverseAdjList(edges)

      // 获取当前节点的所有前置节点ID
      const predecessors = getPredecessorsByNodeId(reverseAdjList, target_node_id)

      // 根据前置节点ID筛选出对应的前置节点对象
      const predecessorNodes = nodes.filter((node) => predecessors.includes(node.id))

      // 初始化结果数组，用于存储所有可引用的变量
      const options: any[] = []
      predecessorNodes.forEach((node) => {
        // 为每个前置节点创建变量组对象
        const node_variables = {
          isGroup: true, // 标记这是一个变量组
          label: node.data.title, // 使用节点标题作为组名
          options: [] as any, // 存储该节点的具体变量
        }

        // 根据节点类型处理变量：
        // - 开始节点：处理输入变量
        // - 其他节点：处理输出变量
        if (node.type === 'start') {
          // 处理开始节点的输入变量
          node.data?.inputs.forEach((variable: any) => {
            node_variables.options.push({
              label: variable.name, // 变量显示名称
              value: `${node.id}/${variable.name}`, // 变量唯一标识
            })
          })
        } else {
          // 处理其他节点的输出变量
          node.data?.outputs.forEach((variable: any) => {
            node_variables.options.push({
              label: `${variable.name}`, // 变量显示名称
              value: `${node.id}/${variable.name}`, // 变量唯一标识
            })
          })
        }
        // 将当前节点的变量组添加到结果数组
        options.push(node_variables)
      })

      return options
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
          k: 5,
          score: 0,
        },
        inputs: [
          {
            name: 'query',
            type: 'string',
            value: { type: 'ref', content: '' },
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
      NODE_DATA_MAP,
      NOTE_TYPES,
      workflow,
      mode,
      isShowMap,
      draftGraph,
      loading,
      getWorkflow,
      getDraftGraph,
      updateDraftGraph,
      buildReverseAdjList,
      getPredecessorsByNodeId,
      getReferencedVariables,
    }
  },
  {
    persist: true,
  },
)
