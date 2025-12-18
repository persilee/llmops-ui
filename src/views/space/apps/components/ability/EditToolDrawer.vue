<script setup lang="ts">
import { BASE_URL, DEFAULT_ICON } from '@/config'
import APIToolsApi from '@/services/api/api-tool'
import type { GetAPIToolResp } from '@/services/api/api-tool/types'
import type { Tool, ToolElement } from '@/services/api/apps/types'
import BuiltinToolApi from '@/services/api/builtin-tool'
import type { GetProviderToolResp } from '@/services/api/builtin-tool/types'
import { typeMap } from '@/utils/util'
import { Message } from '@arco-design/web-vue'
import * as _ from 'lodash-es'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '../../AppView.store'

// 获取应用状态管理store实例
const store = useAppStore()
// 定义组件props，包含可选的工具元素
const props = defineProps<{
  tool?: ToolElement
}>()
// 工具数据的响应式引用，可以是API工具或内置工具的响应数据
const toolData = ref<GetAPIToolResp | GetProviderToolResp>()
// 当前活动的标签页，默认为'info'
const activeTab = ref('info')
// 抽屉的显示状态，使用v-model双向绑定
const visible = defineModel('visible', { type: Boolean, default: false })
// 加载状态标识，用于显示加载动画
const loading = ref(false)
// 表单数据的响应式引用，用于存储工具配置参数
const formData = ref()

/**
 * 获取工具数据
 * 根据工具类型调用不同的API获取工具详细信息
 * 对于内置工具，会初始化或加载已有的参数配置
 */
const fetchData = async () => {
  // 开始加载状态
  loading.value = true

  try {
    // 根据工具类型调用不同的API
    const resp = isApiTool(props.tool)
      ? await APIToolsApi.getApiTool(props.tool.provider.id, props.tool.tool.name)
      : await BuiltinToolApi.getProviderTool(props.tool!.provider.name, props.tool!.tool.name)

    // 保存获取到的工具数据
    toolData.value = resp.data

    // 如果是内置工具，需要处理参数配置
    if (!isApiTool(props.tool)) {
      const providerToolData = toolData.value as GetProviderToolResp

      // 查找是否已存在该工具的配置
      const selectTool = store
        .getExistingTools()
        .find((item: Tool) => item.tool_id === providerToolData.name)

      // 如果存在配置，使用已有配置；否则使用默认值
      if (!_.isEmpty(selectTool)) {
        formData.value = selectTool.params
      } else {
        // 将参数数组转换为对象，使用参数名作为键，默认值作为值
        formData.value = Object.fromEntries(
          providerToolData.params.map((item: any) => [item.name, item.default]),
        )
      }
    }
  } catch (error) {
  } finally {
    // 结束加载状态
    loading.value = false
  }
}

/**
 * 计算属性：判断是否显示设置选项卡
 * @returns {boolean} 返回true表示需要显示设置选项卡
 * 判断条件：
 * 1. 工具类型必须是内置工具 (builtin_tool)
 * 2. 工具数据必须存在
 * 3. 工具数据中必须包含参数数组且参数数量大于0
 */
const isShowSetting = computed(
  () =>
    props.tool?.type == 'builtin_tool' &&
    toolData.value &&
    'params' in toolData.value &&
    toolData.value.params.length > 0,
)

/**
 * 类型守卫函数：判断工具是否为API工具
 * @param tool 工具元素对象，可能为undefined
 * @returns 返回true表示是API工具，同时会进行类型断言
 */
const isApiTool = (tool: ToolElement | undefined): tool is ToolElement & { type: 'api_tool' } => {
  return tool?.type === 'api_tool'
}

/**
 * 获取工具图标URL
 * @returns {string} 返回工具图标的URL地址
 */
const getIcon = () => {
  // 如果是API工具，从API工具数据中获取图标
  if (isApiTool(props.tool)) {
    const apiTool = toolData.value as GetAPIToolResp
    // 返回API工具的图标，如果没有则使用默认图标
    return apiTool?.provider?.icon ?? DEFAULT_ICON
  }

  // 处理内置工具的图标
  const builtinTool = toolData.value as GetProviderToolResp
  // 如果存在provider名称，则构建内置工具的图标URL
  // URL格式为：BASE_URL/builtin-tools/{provider.name}/icon
  // 如果没有provider名称，则使用默认图标
  return builtinTool?.provider.name
    ? `${BASE_URL}/builtin-tools/${builtinTool.provider.name}/icon`
    : DEFAULT_ICON
}

/**
 * 关闭抽屉处理函数
 * 执行两个操作：
 * 1. 关闭抽屉（设置visible为false）
 * 2. 重置活动标签页为'info'（默认显示信息标签页）
 */
const handleClose = () => {
  visible.value = false
  activeTab.value = 'info'
}

/**
 * 切换到信息标签页处理函数
 * 将活动标签页设置为'info'，显示工具的信息内容
 */
const handleInfoTab = () => {
  activeTab.value = 'info'
}

/**
 * 切换到设置标签页处理函数
 * 将活动标签页设置为'setting'，显示工具的设置内容
 */
const handleSettingTab = () => {
  activeTab.value = 'setting'
}

/**
 * 处理表单提交的异步函数
 * 用于更新工具的配置参数
 *
 * @returns {Promise<void>}
 */
const handleSubmit = async () => {
  // 检查表单数据是否存在，如果不存在则直接返回
  if (!formData.value) return

  // 开始加载状态，防止重复提交
  loading.value = true

  try {
    // 获取现有工具列表，并更新匹配的工具参数
    const updateTools = store.getExistingTools().map((tool) => ({
      ...tool,
      // 如果当前工具的provider_id与要更新的工具provider_id匹配，则使用新的表单数据
      params: tool.provider_id === props.tool?.provider.id ? formData.value : tool.params,
    }))

    // 调用store的方法更新应用配置
    const resp = await store.updateDraftAppConfig({ tools: updateTools })

    // 关闭抽屉并重置标签页
    handleClose()
    // 如果更新成功，显示成功消息
    if (resp) Message.success(resp.message)
  } catch (error) {
    // 错误处理（当前为空，可以根据需要添加具体的错误处理逻辑）
  } finally {
    // 无论成功失败，都要关闭加载状态
    loading.value = false
  }
}

/**
 * 监听抽屉的显示状态
 * 当抽屉打开且存在工具数据时，自动获取工具详细信息
 * @param {boolean} val - 抽屉的显示状态
 */
const stop = watch(visible, async (val) => {
  // 如果抽屉打开且存在工具数据，则获取工具详细信息
  if (val && props.tool) {
    await fetchData()
  }
})

// 组件卸载时执行清理操作
onUnmounted(() => {
  // 停止watch监听器，防止内存泄漏
  stop()
})
</script>

<template>
  <a-drawer
    :width="640"
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
        <!-- 内容 -->
        <div class="flex flex-col px-6 py-6 w-full">
          <!-- 标题 -->
          <div class="flex items-center">
            <div class="flex gap-2 text-gray-900 font-medium text-lg">
              <img :src="getIcon()" class="w-6 h-6 rounded-lg" />
              {{ toolData?.name }}
            </div>
            <div class="mx-6.5 text-xs text-gray-400">/</div>
            <div class="flex items-center relative">
              <div
                data-tab="tab1"
                :class="`${'info' == activeTab ? 'active text-gray-900' : 'text-gray-700 hover:bg-gray-100'} px-3 py-0.5 font-bold text-base cursor-pointer rounded-lg`"
                @click="handleInfoTab"
              >
                信息
              </div>
              <div
                data-tab="tab2"
                :class="`${'setting' == activeTab ? 'active text-gray-900' : 'text-gray-700 hover:bg-gray-100'} px-3 py-0.5 text-base cursor-pointer rounded-lg `"
                @click="handleSettingTab"
              >
                设置
              </div>
              <div class="underline"></div>
            </div>
          </div>
          <!-- 工具内容（信息或设置） -->
          <div class="flex-1 flex flex-col mt-6">
            <!-- 信息 -->
            <div v-show="activeTab == 'info'" class="">
              <div class="text-gray-900 font-bold">工具描述</div>
              <div class="text-gray-600 mt-2">
                {{ toolData?.description }}
              </div>
              <div class="flex items-center gap-2 my-4">
                <div class="text-xs text-gray-500 font-bold">参数</div>
                <hr class="flex-1 border-gray-200" />
              </div>
              <div class="flex flex-col gap-4">
                <div
                  v-for="input in toolData?.inputs"
                  :key="input.name"
                  class="flex flex-col gap-2"
                >
                  <div class="flex items-center gap-2 text-xs">
                    <div class="text-gray-900 font-bold">{{ input.name }}</div>
                    <div class="text-gray-500">{{ typeMap[input.type] }}</div>
                    <div class="text-yellow-600">{{ input.required ? '必填' : '' }}</div>
                  </div>
                  <div class="text-xs text-gray-500">{{ input.description }}</div>
                </div>
              </div>
            </div>
            <div v-show="activeTab == 'setting'" class="w-full h-full relative">
              <div v-if="isShowSetting">
                <a-form :model="formData" layout="vertical" @submit="handleSubmit">
                  <a-form-item
                    v-for="(param, idx) in (toolData as GetProviderToolResp).params"
                    :key="idx"
                    :field="param.name"
                    :label="param.label"
                    asterisk-position="end"
                    :rules="[{ required: param.required, message: `${param.name}不能为空` }]"
                  >
                    <a-select
                      v-if="param.type == 'array'"
                      :default-value="formData[param.name]"
                      class="rounded-sm"
                      v-model="formData[param.name]"
                    >
                      <a-option
                        v-for="(option, oIdx) in param.options"
                        :key="oIdx"
                        :value="option.value"
                        >{{ option.label }}</a-option
                      >
                    </a-select>
                    <a-input
                      v-else-if="param.type == 'string'"
                      v-model="formData[param.name]"
                      :placeholder="`请输入${param.label}`"
                      allow-clear
                    ></a-input>
                    <a-input-number
                      v-else-if="param.type == 'number'"
                      v-model="formData[param.name]"
                      :placeholder="`请输入${param.label}`"
                      :max="param.max"
                      :min="param.min"
                      mode="button"
                    ></a-input-number>
                    <a-switch
                      v-else-if="param.type == 'boolean'"
                      v-model="formData[param.name]"
                      type="round"
                    />
                  </a-form-item>
                  <div class="flex-1 flex justify-end items-end mt-4 absolute bottom-0 right-0">
                    <a-button
                      type="outline"
                      class="border-gray-300 text-gray-500 mr-3"
                      @click="handleClose"
                      >取消</a-button
                    >
                    <a-button :loading="loading" type="primary" class="" html-type="submit"
                      >保存</a-button
                    >
                  </div>
                </a-form>
              </div>
              <a-empty v-else description="暂无设置" class="mt-10" />
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

<style scoped>
.underline {
  position: absolute;
  bottom: 0;
  height: 3px;
  background-color: #1d4ed8;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

/* 初始位置 - 按钮 1 下方 */
.active[data-tab='tab1'] ~ .underline {
  left: 13px;
  width: 30px;
}

/* 按钮 2 激活时的位置 */
.active[data-tab='tab2'] ~ .underline {
  left: 69px;
  width: 30px;
}
</style>
