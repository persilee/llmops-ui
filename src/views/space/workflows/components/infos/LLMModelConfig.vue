<script setup lang="ts">
import type { GetLLMModelResp } from '@/services/api/llm-models/types'
import { computed, onMounted, ref, watch } from 'vue'

// 1.定义自定义组件所需数据
const props = defineProps({
  model_config: {
    type: Object,
    default: () => {
      return {}
    },
    required: true,
  },
})
const emits = defineEmits(['update:model_config'])
const form = ref<any>({})
const loading = ref(false)
const llmModel = ref<GetLLMModelResp>({
  model: 'gpt-4o-mini',
  label: 'gpt-4o-mini',
  model_type: 'chat',
  features: ['tool_call', 'agent_thought', 'image_input'],
  context_windows: 128000,
  max_output_tokens: 16384,
  attributes: {
    model: 'gpt-4o-mini',
  },
  metadata: {},
  parameters: [
    {
      name: 'temperature',
      label: '温度',
      type: 'float',
      help: '温度控制随机性，较低的温度会导致较少的随机生成。随着温度接近零，模型将变得更确定，较高的温度会导致更多随机内容被生成。',
      required: false,
      default: 1,
      min: 0,
      max: 2,
      precision: 2,
      options: [],
    },
  ],
})
const modelOptions = computed(() => {
  return {}
})

// 2.定义选择模型处理器
const changeModel = (value: any): any => {
  // 2.1 使用/拆分出提供商+模型名字
  const [provider_name, model_name] = value.split('/')
}

// 3.触发器隐藏处理器，提交数据进行更新
const hideModelTrigger = () => {
  // 3.1 处理表单数据
  const [provider_name, model_name] = form.value.selectValue.split('/')

  // 3.2 提取表单模型配置
  const model_config = {
    provider: provider_name,
    model: model_name,
    parameters: form.value.parameters,
  }

  // 3.3 提交应用草稿配置更新
  emits('update:model_config', model_config)
}

watch(
  () => props.model_config,
  (newValue) => {
    // 1.完成表单数据初始化
    form.value['selectValue'] = `${newValue?.provider}/${newValue.model}`
    form.value['provider'] = newValue?.provider
    form.value['model'] = newValue?.model
    form.value['parameters'] = newValue?.parameters
  },
  { immediate: true },
)

onMounted(() => {})
</script>

<template>
  <a-trigger
    v-if="props.model_config?.provider"
    trigger="click"
    position="br"
    :popup-translate="[0, 12]"
    @hide="hideModelTrigger"
  >
    <div class="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-1.5 py-1 rounded-md">
      <a-avatar :size="16" shape="square" :image-url="`/language-models/${form?.provider}/icon`" />
      <div class="text-gray-700 text-xs">{{ form?.model }}</div>
      <icon-down class="w-3 h-3 text-gray-500" />
    </div>
    <template #content>
      <div class="bg-white px-6 py-5 shadow rounded-lg w-[460px]">
        <!-- 标题 -->
        <div class="text-gray-700 text-base font-semibold mb-3">模型设置</div>
        <!-- 模型选择 -->
        <div class="flex flex-col gap-2 mb-2">
          <div class="text-gray-700">模型</div>
          <a-select
            v-model:model-value="form.selectValue"
            :options="modelOptions"
            size="small"
            class="rounded-lg mb-2"
            placeholder="请选择Agent使用的大语言模型"
            @change="changeModel"
          >
            <template #label="{ data }">
              <div class="flex items-center gap-2">
                <a-avatar
                  :size="16"
                  shape="square"
                  :image-url="`/language-models/${data.value.split('/')[0]}/icon`"
                />
                <a-space :size="4">
                  <div class="text-xs text-gray-700">{{ data.value.split('/')[0] }}</div>
                  <div class="text-xs text-gray-500">·</div>
                  <div class="text-xs text-gray-700">{{ data.value.split('/')[1] }}</div>
                </a-space>
              </div>
            </template>
            <template #option="{ data }">
              <div class="flex items-center gap-2">
                <a-avatar
                  :size="16"
                  shape="square"
                  :image-url="`/language-models/${data.value.split('/')[0]}/icon`"
                />
                <div class="text-xs text-gray-700 py-2">{{ data.label }}</div>
              </div>
            </template>
          </a-select>
        </div>
        <!-- 参数列表 -->
        <div class="text-gray-700 mb-2">参数</div>
        <a-spin :loading="loading" class="w-full">
          <div
            v-for="parameter in llmModel.parameters"
            :key="parameter.name"
            class="flex items-center gap-2 h-8 mb-4"
          >
            <!-- 字段标签 -->
            <div class="flex items-center gap-2 text-gray-500 w-[120px] flex-shrink-0">
              <div class="text-xs">{{ parameter?.label }}</div>
              <a-tooltip :content="parameter?.help">
                <icon-question-circle />
              </a-tooltip>
            </div>
            <!-- 字段输入框 -->
            <template v-if="parameter?.options?.length > 0">
              <a-select
                v-model:model-value="form.parameters[parameter.name]"
                :default-value="parameter.default"
                placeholder="请选择参数值"
                :options="parameter.options"
              />
            </template>
            <template v-else-if="parameter.type === 'boolean'">
              <a-select
                v-model:model-value="form.parameters[parameter.name]"
                :default-value="parameter.default"
                placeholder="请选择参数值"
                :options="[
                  { label: '是', value: true },
                  { label: '否', value: false },
                ]"
              />
            </template>
            <template v-else-if="['int', 'float'].includes(parameter.type)">
              <a-slider
                v-model:model-value="form.parameters[parameter.name]"
                :default-value="parameter.default"
                :min="parameter?.min"
                :max="parameter?.max"
                :step="parameter?.type === 'float' ? 0.1 : 1"
                show-input
              />
            </template>
            <template v-else-if="parameter.type === 'string'">
              <a-input
                v-model:model-value="form.parameters[parameter.name]"
                :default-value="parameter.default"
                placeholder="请输入参数值"
              />
            </template>
          </div>
        </a-spin>
      </div>
    </template>
  </a-trigger>
</template>

<style scoped></style>
