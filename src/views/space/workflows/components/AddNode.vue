<script setup lang="ts">
import { BASE_URL } from '@/config'
import { Message } from '@arco-design/web-vue'
import { useVueFlow } from '@vue-flow/core'
import { remove } from 'lodash-es'
import { v4 } from 'uuid'
import { ref } from 'vue'
import { useWorkflowStore } from '../Workflow.store'
import AddToolModal from './AddToolModal.vue'

const NODE_WIDTH = 360
const NODE_SPACING = 80

const props = defineProps<{
  addNodeType?: string
  edgeId?: string
  nodeId?: string
  id: string
}>()
const visible = defineModel('visible', { type: Boolean, default: false })
// 从 Vue Flow 中解构获取 nodes 对象
// nodes 包含了流程图中所有节点的状态信息，包括位置、数据、选中状态等
const { nodes, setNodes, findNode } = useVueFlow()
// 获取工作流状态管理实例
// store 用于管理整个工作流的全局状态，包括节点数据、连接关系、执行状态等
const store = useWorkflowStore()
const addToolModalVisible = ref(false)
const pythonTypeMap: Record<string, any> = {
  str: 'string',
  int: 'int',
  float: 'float',
  bool: 'boolean',
}

/**
 * 统计数组中特定类型元素的数量
 * @param {any[]} items - 要统计的数组
 * @param {string} type - 要统计的元素类型
 * @returns {number} 匹配类型的元素数量
 */
const countByType = (items: any[], type: string) =>
  items.filter((item) => {
    return item.data.title === type
  }).length

/**
 * 修复节点重叠问题
 * @param {string} newNodeId - 新添加节点的ID
 */
const fixNodeOverlap = (newNodeId: string) => {
  // 获取所有节点并创建副本
  const allNodes = store.draftGraph.nodes
  const updatedNodes = [...allNodes]

  // 找到新添加的节点
  const newNodeIndex = updatedNodes.findIndex((node) => node.id === newNodeId)
  if (newNodeIndex === -1) return

  const newNode = updatedNodes[newNodeIndex]

  // 找到所有与新节点重叠的节点
  const overlappingNodes = updatedNodes.filter((node) => {
    // 跳过新节点本身
    if (node.id === newNodeId) return false

    // 计算当前节点和新节点的左右边界
    const nodeLeft = node.position.x
    const nodeRight = node.position.x + NODE_WIDTH
    const newNodeLeft = newNode.position.x
    const newNodeRight = newNode.position.x + NODE_WIDTH

    // 判断是否重叠：如果新节点的右边界小于当前节点的左边界，或新节点的左边界大于当前节点的右边界，则不重叠
    return !(newNodeRight < nodeLeft || newNodeLeft > nodeRight)
  })

  // 如果没有重叠节点，直接返回
  if (overlappingNodes.length === 0) return

  // 计算需要移动的距离
  // 找到所有重叠节点中最右边的位置
  const maxOverlapRight = Math.max(...overlappingNodes.map((node) => node.position.x))
  // 计算新节点应该放置的位置（最右边重叠节点的位置 + 节点间距）
  const requiredLeft = maxOverlapRight + NODE_SPACING
  // 计算需要移动的距离（新节点应该的位置 + 节点宽度 - 当前位置）
  const moveDistance = requiredLeft + NODE_WIDTH - newNode.position.x

  // 如果移动距离小于等于0，说明不需要移动
  if (moveDistance <= 0) return

  // 移动所有在新节点右边的节点
  updatedNodes.forEach((node) => {
    // 如果节点不是新节点，且节点位置在新节点位置的右侧（考虑节点宽度的一半），则需要移动
    if (node.id !== newNodeId && node.position.x > newNode.position.x - NODE_WIDTH / 2) {
      // 将节点向右移动计算出的距离
      node.position.x += moveDistance
    }
  })

  // 将新节点移动到计算出的位置
  newNode.position.x = requiredLeft

  // 更新节点位置
  setNodes(updatedNodes)
}

/**
 * 向工作流中添加新节点
 * @param {string} nodeType - 要添加的节点类型
 * @returns {void}
 */
const addNode = (nodeType: string, nodeData: any = null) => {
  // 检查是否为开始节点
  if (nodeType === 'start') {
    // 如果已存在开始节点，则报错并返回
    if (nodes.value.some((node) => node.type === 'start')) {
      Message.warning('工作流中只允许有一个开始节点')
      return
    }
  } else if (nodeType === 'end') {
    // 如果已存在结束节点，则报错并返回
    if (nodes.value.some((node) => node.type === 'end')) {
      Message.warning('工作流中只允许有一个结束节点')
      return
    }
  }

  // 初始化新节点的位置坐标
  let xPosition = 0
  let yPosition = 0

  // 如果没有传入节点数据，则从store中获取对应类型的默认节点数据
  if (!nodeData) {
    nodeData = store.NODE_DATA_MAP[nodeType]
  }

  // 节点标题
  const nodeTitle =
    countByType(nodes.value, nodeData.title) > 0
      ? `${nodeData.title}_${countByType(nodes.value, nodeData.title)}`
      : nodeData.title

  /**
   * 点击边中间的新增按钮时，新增 node 和 edge
   * 1. 找到被点击的边
   * 2. 找到源节点和目标节点
   * 3. 计算新节点的位置
   * 4. 添加新节点，位置在源节点和目标节点中间
   * 5. 删除原来的边
   * 6. 添加新的边连接新节点和源节点、目标节点
   */
  if (props.addNodeType === 'edge' && props.edgeId) {
    // 找到被点击的edge
    const edge = store.draftGraph.edges.find((edge) => edge.id === props.edgeId)
    if (!edge) return

    // 找到源节点和目标节点
    const sourceNode = nodes.value.find((n) => n.id === edge.source)
    const targetNode = nodes.value.find((n) => n.id === edge.target)
    if (!sourceNode || !targetNode) return

    // 计算新节点的位置（在两个节点中间）
    xPosition = (sourceNode.position.x + targetNode.position.x) / 2
    yPosition = (sourceNode.position.y + targetNode.position.y) / 2

    const nodeId = v4()
    // 创建新节点并添加到图中
    store.draftGraph.nodes.push({
      id: nodeId, // 生成唯一ID
      type: nodeType, // 设置节点类型
      position: { x: xPosition, y: yPosition }, // 设置节点位置为平均位置
      data: {
        ...nodeData, // 复制节点基础数据
        title: nodeTitle,
      },
    })

    // 移除现有边
    remove(store.draftGraph.edges, (edge) => edge.id === props.edgeId)

    // 创建新的边
    store.draftGraph.edges.push(
      {
        id: v4(),
        source: edge.source,
        target: nodeId,
        source_type: sourceNode?.type,
        target_type: nodeType,
        animated: true,
        type: 'custom',
        style: { fill: 'none' },
      },
      {
        id: v4(),
        source: nodeId,
        target: edge.target,
        source_type: nodeType,
        target_type: targetNode?.type,
        animated: true,
        type: 'custom',
        style: { fill: 'none' },
      },
    )
    // 修复节点重叠
    setTimeout(async () => {
      fixNodeOverlap(nodeId)
    }, 0)
  } else if (props.addNodeType === 'handle') {
    /**
     * 点击右handle按钮添加节点时
     * 1. 获取原始节点
     * 2. 计算新节点的位置
     * 3. 创建新节点并添加到图中（放到原始节点右侧，间隔80px）
     * 4. 添加一条新的边
     * 5. 修复节点重叠
     */
    const node = findNode(props.nodeId)

    if (!node) return

    xPosition = node.position.x + NODE_WIDTH + NODE_SPACING
    yPosition = node.position.y
    const nodeId = v4()
    // 创建新节点并添加到图中
    store.draftGraph.nodes.push({
      id: nodeId, // 生成唯一ID
      type: nodeType, // 设置节点类型
      position: { x: xPosition, y: yPosition }, // 设置节点位置为平均位置
      data: {
        ...nodeData, // 复制节点基础数据
        title: nodeTitle,
      },
    })
    // 创建新的边
    store.draftGraph.edges.push({
      id: v4(),
      source: node.id,
      target: nodeId,
      source_type: node.type,
      target_type: nodeType,
      animated: true,
      type: 'custom',
      style: { fill: 'none' },
    })
    // 修复节点重叠
    setTimeout(async () => {
      fixNodeOverlap(nodeId)
    }, 0)
  } else {
    /**
     * 点击底部控制栏添加节点按钮时，新增 node
     * 1. 计算所有节点的位置总和
     * 2. 计算所有节点的平均位置
     * 3. 创建新节点并添加到图中心位置
     */
    // 获取当前节点总数
    const nodeCount = nodes.value.length
    // 计算所有节点的位置总和
    const total = nodes.value.reduce(
      (acc, item) => {
        acc.xSum += item.position.x
        acc.ySum += item.position.y
        return acc
      },
      { xSum: 0, ySum: 0 },
    )
    // 计算节点的平均位置，如果没有节点则默认为(0,0)
    xPosition = nodeCount > 0 ? total.xSum / nodeCount : 0
    yPosition = nodeCount > 0 ? total.ySum / nodeCount : 0

    // 创建新节点并添加到图中
    store.draftGraph.nodes.push({
      id: v4(), // 生成唯一ID
      type: nodeType, // 设置节点类型
      position: { x: xPosition, y: yPosition }, // 设置节点位置为平均位置
      data: {
        ...nodeData, // 复制节点基础数据
        title: nodeTitle,
      },
    })
  }

  visible.value = false
}

const addToolNode = () => {
  addToolModalVisible.value = true
}

const handleAddTool = (tool: any) => {
  const toolData: any = {}
  if (tool.type == 'api_tool') {
    toolData.meta = {
      type: 'api_tool',
      provider: {
        id: tool.provider.id,
        name: tool.provider.name,
        label: tool.provider.name,
        icon: tool.provider.icon,
        description: tool.provider.description,
      },
      tool: {
        id: tool.tool.name,
        name: tool.tool.name,
        label: tool.tool.name,
        description: tool.tool.description,
        params: {},
      },
    }
    toolData.inputs = tool.tool.inputs.map((item: any) => {
      return {
        name: item.name,
        description: '',
        required: true,
        type: pythonTypeMap[item.type],
        value: { type: 'ref', content: '' },
        meta: {},
      }
    })
    toolData.type = 'api_tool'
    toolData.provider_id = tool.provider.id
    toolData.params = {}
  } else {
    toolData.meta = {
      type: 'builtin_tool',
      provider: {
        id: tool.provider.name,
        name: tool.provider.name,
        label: tool.provider.label,
        icon: `${BASE_URL}/builtin-tools/${tool.provider.name}/icon`,
        description: tool.provider.description,
      },
      tool: {
        id: tool.tool.name,
        name: tool.tool.name,
        label: tool.tool.label,
        description: tool.tool.description,
        params: tool.tool['params'],
      },
    }
    toolData.inputs = tool.tool.inputs.map((item: any) => {
      return {
        name: item.name,
        description: '',
        required: true,
        type: pythonTypeMap[item.type],
        value: { type: 'ref', content: '' },
        meta: {},
      }
    })
    toolData.type = 'builtin_tool'
    toolData.provider_id = tool.provider.name
    toolData.params = tool.tool['params'].reduce((newObj: any, item: any) => {
      newObj[item.name] = item.default
      return newObj
    }, {})
  }
  toolData.outputs = [{ name: 'text', type: 'string', value: { type: 'generated', content: '' } }]
  toolData.title = tool.tool.name
  toolData.description = tool.tool.description
  toolData.tool_id = tool.tool.name
  addNode('tool', toolData)
}
</script>

<template>
  <div
    v-if="visible && store.showedAddNode == id"
    class="flex flex-col gap-2 px-2 py-3 bg-white rounded-lg shadow-sm border border-gray-200 w-[320px]"
    @click.stop
  >
    <div class="flex gap-2">
      <!-- 开始节点 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-blue-700 rounded-lg">
                <icon-home />
              </a-avatar>
              <div class="text-gray-700 font-semibold">开始节点</div>
            </div>
            <div class="text-gray-500 text-xs">
              工作流的起始节点，支持定义工作流的起点输入等信息。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('start')"
        >
          <a-avatar shape="square" :size="24" class="bg-blue-700 rounded-lg">
            <icon-home />
          </a-avatar>
          <div class="text-gray-700 font-semibold">开始节点</div>
        </div>
      </a-popover>
      <!-- 结束节点 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-red-700 rounded-lg">
                <icon-filter />
              </a-avatar>
              <div class="text-gray-700 font-semibold">结束节点</div>
            </div>
            <div class="text-gray-500 text-xs">
              工作流的结束节点，支持定义工作流最终输出的变量等信息。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('end')"
        >
          <a-avatar shape="square" :size="24" class="bg-red-700 rounded-lg">
            <icon-filter />
          </a-avatar>
          <div class="text-gray-700 font-semibold">结束节点</div>
        </div>
      </a-popover>
    </div>
    <div class="flex gap-2">
      <!-- 大语言模型节点 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-sky-500 rounded-lg">
                <icon-language />
              </a-avatar>
              <div class="text-gray-700 font-semibold">大语言模型</div>
            </div>
            <div class="text-gray-500 text-xs">调用大语言模型，根据输入参数和提示词生成回复。</div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('llm')"
        >
          <a-avatar shape="square" :size="24" class="bg-sky-500 rounded-lg">
            <icon-language />
          </a-avatar>
          <div class="text-gray-700 font-semibold">大语言模型</div>
        </div>
      </a-popover>
      <!-- 扩展插件 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-orange-500 rounded-lg">
                <icon-tool />
              </a-avatar>
              <div class="text-gray-700 font-semibold">扩展插件</div>
            </div>
            <div class="text-gray-500 text-xs">
              添加插件广场内或自定义API插件，支持能力扩展和复用。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addToolNode()"
        >
          <a-avatar shape="square" :size="24" class="bg-orange-500 rounded-lg">
            <icon-tool />
          </a-avatar>
          <div class="text-gray-700 font-semibold">扩展插件</div>
        </div>
      </a-popover>
    </div>
    <div class="flex gap-2">
      <!-- 知识库检索 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-violet-500 rounded-lg">
                <icon-storage />
              </a-avatar>
              <div class="text-gray-700 font-semibold">知识库检索</div>
            </div>
            <div class="text-gray-500 text-xs">
              根据输入的参数，在选定的知识库中检索相关片段并召回，返回切片列表。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('dataset_retrieval')"
        >
          <a-avatar shape="square" :size="24" class="bg-violet-500 rounded-lg">
            <icon-storage />
          </a-avatar>
          <div class="text-gray-700 font-semibold">知识库检索</div>
        </div>
      </a-popover>
      <!-- 模板转换 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-emerald-400 rounded-lg">
                <icon-branch />
              </a-avatar>
              <div class="text-gray-700 font-semibold">模板转换</div>
            </div>
            <div class="text-gray-500 text-xs">对多个字符串变量的格式进行处理。</div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('template_transform')"
        >
          <a-avatar shape="square" :size="24" class="bg-emerald-400 rounded-lg">
            <icon-branch />
          </a-avatar>
          <div class="text-gray-700 font-semibold">模板转换</div>
        </div>
      </a-popover>
    </div>
    <div class="flex gap-2">
      <!-- 意图识别节点 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-green-700 rounded-lg">
                <icon-mind-mapping />
              </a-avatar>
              <div class="text-gray-700 font-semibold">意图识别</div>
            </div>
            <div class="text-gray-500 text-xs">
              定义用户问题的分类条件，LLM能够根据分类描述执行不同的分支。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('question_classifier')"
        >
          <a-avatar shape="square" :size="24" class="bg-green-700 rounded-lg">
            <icon-mind-mapping />
          </a-avatar>
          <div class="text-gray-700 font-semibold">意图识别</div>
        </div>
      </a-popover>
      <!-- 迭代节点 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-pink-700 rounded-lg">
                <icon-sync />
              </a-avatar>
              <div class="text-gray-700 font-semibold">迭代节点</div>
            </div>
            <div class="text-gray-500 text-xs">
              传递一个列表型数据，并引用一个工作流完成多轮迭代得到处理后的列表数据。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('iteration')"
        >
          <a-avatar shape="square" :size="24" class="bg-pink-700 rounded-lg">
            <icon-sync />
          </a-avatar>
          <div class="text-gray-700 font-semibold">迭代节点</div>
        </div>
      </a-popover>
    </div>
    <div class="flex gap-2">
      <!-- HTTP请求 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-rose-500 rounded-lg">
                <icon-link />
              </a-avatar>
              <div class="text-gray-700 font-semibold">HTTP请求</div>
            </div>
            <div class="text-gray-500 text-xs">配置外部API服务，并发起请求。</div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('http_request')"
        >
          <a-avatar shape="square" :size="24" class="bg-rose-500 rounded-lg">
            <icon-link />
          </a-avatar>
          <div class="text-gray-700 font-semibold">HTTP请求</div>
        </div>
      </a-popover>
      <!-- 代码执行 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-cyan-500 rounded-lg">
                <icon-code />
              </a-avatar>
              <div class="text-gray-700 font-semibold">代码执行</div>
            </div>
            <div class="text-gray-500 text-xs">编写代码处理输入输出变量来生成返回值。</div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('code')"
        >
          <a-avatar shape="square" :size="24" class="bg-cyan-500 rounded-lg">
            <icon-code />
          </a-avatar>
          <div class="text-gray-700 font-semibold">代码执行</div>
        </div>
      </a-popover>
    </div>
    <!-- 插件弹窗 -->
    <AddToolModal
      v-model:visible="addToolModalVisible"
      @add-tool="handleAddTool"
      @close-modal="visible = false"
    />
  </div>
</template>

<style scoped></style>
