<script setup lang="ts">
import APIToolsApi from '@/services/api/api-tool'
import type { Tool as CustomTool, GetAPIToolProvidersWithPage } from '@/services/api/api-tool/types'

import BuiltinToolApi from '@/services/api/builtin-tool'
import type {
  Tool as BuiltinTool,
  GetBuiltinToolsResp,
  GetCategoriesResp,
} from '@/services/api/builtin-tool/types'
import type { Paginator } from '@/services/types'
import { svgToImgData } from '@/utils/util'
import { Message } from '@arco-design/web-vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '../../AppView.store'
import BuiltinTools from './BuiltinTools.vue'
import CustomTools from './CustomTools.vue'

const store = useAppStore() // 应用状态管理store实例
const visible = defineModel('visible', { type: Boolean, default: false }) // 控制抽屉组件的显示/隐藏状态
const loading = ref(false) // 整体加载状态，用于显示/隐藏加载动画
const toolsLoading = ref(false) // 内置工具列表加载状态
const builtinLoading = ref(false) // 自定义工具列表加载状态
const loadMorLoading = ref(false) // 加载更多数据的加载状态
const providers = ref<GetAPIToolProvidersWithPage[]>([]) // 自定义工具提供者列表
const builtinTools = ref<Array<GetBuiltinToolsResp>>([]) // 内置工具列表
const categories = ref<Array<GetCategoriesResp>>([]) // 工具分类列表
const category = ref<string>('all') // 当前选中的工具分类，默认为'all'
const btnActive = ref<string>('customTool') // 当前激活的按钮状态，默认为自定义工具
const selectIndex = ref(-1) // 当前选中的工具索引
const paginator = ref<Paginator>({
  // 分页信息对象
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示数量
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
})

/**
 * 过滤内置工具列表的计算属性
 *
 * 根据当前选中的类别(category)来筛选内置工具列表：
 * - 当category为'all'时，显示所有工具
 * - 当category为具体类别时，只显示该类别下的工具
 *
 * @returns {Array<GetBuiltinToolsResp>} 过滤后的内置工具列表
 */
const filterBuiltinTools = computed(() => {
  return builtinTools.value.filter((item) => {
    return item.category === category.value || category.value === 'all'
  })
})

/**
 * 关闭工具抽屉
 *
 * 该函数用于关闭工具选择抽屉组件。
 * 通过将visible的值设置为false来触发抽屉的关闭动画。
 * 这个函数通常在以下情况被调用：
 * 1. 用户点击关闭按钮
 * 2. 成功添加工具后自动关闭
 * 3. 其他需要关闭抽屉的场景
 */
const handleClose = () => {
  visible.value = false
  btnActive.value = 'customTool'
  category.value = 'all'
  selectIndex.value = -1
}

/**
 * 获取初始数据
 *
 * 该函数在抽屉打开时被调用，用于并行获取工具分类和自定义工具数据。
 * 使用Promise.all同时发起两个请求以提高加载效率。
 *
 * 执行流程：
 * 1. 设置加载状态为true，显示加载动画
 * 2. 并行请求工具分类和自定义工具数据
 * 3. 将获取到的分类数据存储到categories中
 * 4. 无论成功失败，最后都会关闭加载状态
 *
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成状态
 */
const fetchData = async () => {
  try {
    loading.value = true
    const [categoriesResp] = await Promise.all([BuiltinToolApi.getCategories(), getToolsData()])
    categories.value = categoriesResp.data
  } catch (error) {
  } finally {
    loading.value = false
  }
}

/**
 * 获取内置工具列表数据
 *
 * 该函数用于从后端API获取所有可用的内置工具列表。
 * 在获取数据过程中会显示加载状态，并在完成后更新组件中的内置工具数据。
 *
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成状态
 */
const getBuiltinTools = async () => {
  try {
    // 设置加载状态，显示加载动画
    toolsLoading.value = true
    // 调用API获取内置工具列表
    const resp = await BuiltinToolApi.getBuiltinTools()
    // 更新组件中的内置工具数据
    builtinTools.value = resp.data
  } catch (error) {
    // 错误处理：如果获取失败，保持现有数据不变
  } finally {
    // 无论成功失败，都关闭加载状态
    toolsLoading.value = false
  }
}

/**
 * 获取工具数据，支持分页加载
 * @param {boolean} isLoadMore - 是否为加载更多操作，默认为false
 */
const getToolsData = async (isLoadMore: boolean = false) => {
  // 处理分页逻辑
  if (isLoadMore) {
    // 如果是加载更多，检查是否还有下一页
    if (paginator.value.current_page >= paginator.value.total_page) return
    // 页码递增
    paginator.value.current_page++
  } else {
    // 如果是重新加载，重置页码并清空现有数据
    paginator.value.current_page = 1
    providers.value = []
  }

  try {
    // 设置加载状态，显示加载动画
    loadMorLoading.value = true

    // 调用API获取工具数据
    const resp = await APIToolsApi.getAPIToolProvidersWithPage({
      current_page: paginator.value.current_page,
      page_size: paginator.value.page_size,
    })
    // 将新数据追加到现有列表中
    providers.value.push(...resp.data.list)
    // 更新分页信息
    paginator.value = resp.data.paginator
  } catch (err) {
    // 错误处理：显示错误消息
    const errorMessage = err instanceof Error ? err.message : '数据加载失败'
    Message.error(errorMessage)
  } finally {
    // 无论成功失败，都关闭加载状态
    loadMorLoading.value = false
  }
}

/**
 * 处理切换到自定义工具视图的操作
 * 当用户点击自定义工具按钮时触发此函数
 *
 * 执行以下操作：
 * 1. 将当前激活的按钮状态设置为 'customTool'
 * 2. 显示加载状态（设置 builtinLoading 为 true）
 * 3. 调用 getToolsData() 获取自定义工具列表数据
 * 4. 数据加载完成后，隐藏加载状态（设置 builtinLoading 为 false）
 */
const handleCustomTool = async () => {
  btnActive.value = 'customTool'
  builtinLoading.value = true
  await getToolsData()
  builtinLoading.value = false
}

/**
 * 处理切换到内置工具视图的操作
 * 当用户点击内置工具按钮时触发此函数
 *
 * 执行以下操作：
 * 1. 将当前激活的按钮状态设置为 'builtinTool'
 * 2. 调用 getBuiltinTools() 获取内置工具列表数据
 */
const handleBuiltinTool = () => {
  btnActive.value = 'builtinTool'
  getBuiltinTools()
}

/**
 * 处理滚动事件，实现无限滚动加载功能
 * @param {Event} e - 滚动事件对象
 */
const handleScroll = (e: Event) => {
  // 将事件目标转换为HTMLElement类型，以便访问其滚动相关属性
  const target = e.target as HTMLElement

  // 检查是否滚动到接近底部（距离底部16px时触发）
  // target.scrollTop: 当前滚动位置
  // target.clientHeight: 可见区域高度
  // target.scrollHeight: 总内容高度
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    // 如果正在加载中，则不重复触发加载
    if (loadMorLoading.value) return

    // 触发加载更多数据
    getToolsData(true)
  }
}

/**
 * 添加自定义工具到应用配置中
 * @param provider API工具提供者信息，包含提供者的ID等元数据
 * @param tool 要添加的自定义工具对象，包含工具的ID等信息
 */
const addCustomTool = async (provider: GetAPIToolProvidersWithPage, tool: CustomTool) => {
  try {
    // 设置加载状态，显示加载动画
    loading.value = true

    // 构建更新后的工具列表
    const updatedTools = [
      // 展开当前已存在的工具列表
      ...store.getExistingTools(),
      // 添加新的自定义工具
      {
        params: {}, // 工具参数对象，当前为空对象
        provider_id: provider.id, // 使用提供者的ID
        tool_id: tool.id, // 使用工具的ID
        type: 'api_tool' as const, // 标识为API工具类型
      },
    ]

    // 调用store方法更新应用配置
    await store.updateDraftAppConfig({ tools: updatedTools })

    Message.success('添加扩展插件成功')
  } catch (error) {
    // 错误处理：如果添加失败，保持抽屉打开状态
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

/**
 * 添加内置工具到应用配置中
 * @param provider 内置工具提供者信息，包含工具的元数据
 * @param tool 要添加的内置工具对象
 */
const addBuiltinTool = async (provider: GetBuiltinToolsResp, tool: BuiltinTool) => {
  try {
    // 设置加载状态，显示加载动画
    loading.value = true

    // 获取当前已存在的工具列表，并添加新工具
    const updatedTools = [
      ...store.getExistingTools(),
      {
        params: Object.fromEntries(tool.params.map((item: any) => [item.name, item.default])), // 工具参数对象，将内置工具的参数默认值转换为键值对
        provider_id: provider.name, // 使用提供者名称作为ID
        tool_id: tool.name, // 使用工具名称作为ID
        type: 'builtin_tool' as const, // 标识为内置工具类型
      },
    ]

    // 调用store方法更新应用配置
    await store.updateDraftAppConfig({
      tools: updatedTools,
    })

    Message.success('添加扩展插件成功')
  } catch (error) {
    // 错误处理：如果添加失败，保持抽屉打开状态
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

/**
 * 监听抽屉的显示状态变化
 * 当抽屉打开时（visible为true），自动获取初始数据
 *
 * @param {boolean} val - 抽屉的显示状态
 * @returns {void}
 */
const stop = watch(visible, async (val) => {
  if (val) {
    await fetchData()
  }
})

/**
 * 组件卸载时的清理操作
 *
 * 当组件被卸载时，需要停止之前创建的 watch 监听器，
 * 以防止内存泄漏和不必要的监听继续执行。
 * 这是一个重要的清理步骤，确保组件在销毁时正确释放资源。
 */
onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-drawer
    :width="740"
    v-model:visible="visible"
    :mask-closable="false"
    :header="false"
    :footer="false"
    :drawer-style="{ backgroundColor: 'transparent' }"
    body-class="rounded-lg m-4 p-0"
  >
    <a-spin :loading="loading" class="w-full h-full">
      <div class="flex bg-white w-full h-full relative">
        <!-- 关闭按钮 -->
        <div class="absolute top-4 right-3">
          <a-button type="text" size="mini" @click="handleClose" class="rounded-full">
            <template #icon><icon-close class="text-gray-500" /></template>
          </a-button>
        </div>
        <!-- 左边导航 -->
        <div class="flex flex-col w-[200px] bg-gray-200 px-3 py-4">
          <!-- 标题 -->
          <div class="text-lg font-bold text-gray-900 mb-4">添加插件</div>
          <!-- 按钮 -->
          <a-button type="primary" long>
            <template #icon><icon-plus /></template>
            创建自定义插件
          </a-button>
          <!-- 导航（自定义插件和内置插件） -->
          <div class="flex flex-col mt-4">
            <!-- 自定义插件 -->
            <div
              :class="`flex items-center rounded-lg  px-3 py-1 mb-1 hover:bg-gray-100 cursor-pointer ${'customTool' == btnActive ? 'text-blue-600 bg-gray-100' : 'text-gray-700'}`"
              @click="handleCustomTool"
            >
              <img
                src="@/assets/images/icon-custom-tool.svg"
                :class="`w-4 h-4 inline-block mr-2 ${'customTool' == btnActive ? 'icon-active' : ''}`"
              />
              自定义插件
            </div>
            <!-- 内置插件 -->
            <div
              data-name="builtin"
              :class="`flex items-center rounded-lg  px-3 py-1 mb-1 hover:bg-gray-100 cursor-pointer ${'builtinTool' == btnActive ? 'text-blue-600 bg-gray-100' : 'text-gray-700'}`"
              @click="handleBuiltinTool"
            >
              <img
                src="@/assets/images/icon-built-in.svg"
                :class="`w-4 h-4 inline-block mr-2 ${'builtinTool' == btnActive ? 'icon-active' : ''}`"
              />
              内置插件
            </div>
            <!-- 类别 -->
            <div v-if="'builtinTool' == btnActive" class="">
              <div class="text-gray-500 text-xs my-2">类别</div>
              <div
                :class="`flex items-center rounded-lg  px-3 py-1 mb-1 hover:bg-gray-100 cursor-pointer ${category == 'all' ? 'text-blue-600 bg-gray-100' : 'text-gray-700'}`"
                @click="category = 'all'"
              >
                <img
                  src="@/assets/images/icon-all-tool.svg"
                  :class="`w-4 h-4 inline-block mr-2 p-[1px] ${category == 'all' ? 'icon-active' : ''}`"
                />
                全部
              </div>
              <div
                v-for="(item, idx) in categories"
                :key="idx"
                :class="`flex items-center rounded-lg  px-3 py-1 mb-1 hover:bg-gray-100 cursor-pointer ${category == item.category ? 'text-blue-600 bg-gray-100' : 'text-gray-700'}`"
                @click="category = item.category"
              >
                <img
                  :src="svgToImgData(item.icon)"
                  :class="`w-4 h-4 inline-block mr-2 ${category == item.category ? 'icon-active' : ''}`"
                />
                {{ item.name }}
              </div>
            </div>
          </div>
        </div>
        <!-- 右边内容 -->
        <div class="flex-1 px-3.5 py-4 bg-white w-[524px] flex-shrink-0">
          <CustomTools
            v-if="'customTool' == btnActive"
            :loading="builtinLoading"
            :load-mor-loading="loadMorLoading"
            :providers="providers"
            :paginator="paginator"
            v-model:select-index="selectIndex"
            @handle-scroll="handleScroll"
            @load-more="getToolsData(true)"
            @add-tool="addCustomTool"
          />
          <BuiltinTools
            v-if="'builtinTool' == btnActive"
            :loading="toolsLoading"
            :builtin-tools="filterBuiltinTools"
            v-model:select-index="selectIndex"
            @add-tool="addBuiltinTool"
          />
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

<style scoped></style>
