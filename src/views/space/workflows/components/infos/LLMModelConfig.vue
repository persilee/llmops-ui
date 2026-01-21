<script setup lang="ts">
import { BASE_URL } from '@/config'
import LLMModelApi from '@/services/api/llm-models'
import type { GetLLMModelResp, GetLLMModelsResp } from '@/services/api/llm-models/types'
import { llmTagMap } from '@/utils/util'
import { cloneDeep } from 'lodash-es'
import { computed, onMounted, ref, watch } from 'vue'

// 定义自定义组件所需数据
const props = defineProps({
  model_config: {
    type: Object,
    default: () => {
      return {}
    },
    required: true,
  },
})
const emits = defineEmits(['updateModelConfig'])
const form = ref<any>({})
const loading = ref(false)
const llmModel = ref<GetLLMModelResp>()
const llmModels = ref<GetLLMModelsResp[]>([])
const isModelListTriggerVisible = ref(false)
const isParametersTriggerVisible = ref(false)

const getLLMModels = async () => {
  try {
    loading.value = true
    const resp = await LLMModelApi.getLLMModels()
    llmModels.value = resp.data
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const getLLMModelInfo = async (providerName: string, modelName: string) => {
  try {
    loading.value = true
    const resp = await LLMModelApi.getLLMModel(providerName, modelName)
    llmModel.value = resp.data
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const handleSelectModel = async (provider: string, model: string) => {
  try {
    loading.value = true
    isModelListTriggerVisible.value = false
    await getLLMModelInfo(provider, model)
    form.value.provider = provider
    form.value.model = model
    emits('updateModelConfig', form.value)
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const maxTokensOption = computed(() => {
  return llmModel.value?.parameters.find((item) => item.name === 'max_tokens')
})

const updateParameters = () => {
  emits('updateModelConfig', form.value)
}

watch(
  () => props.model_config,
  (newValue) => {
    form.value = cloneDeep(newValue)
  },
  { immediate: true },
)

onMounted(async () => {
  await getLLMModels()
  await getLLMModelInfo(props.model_config.provider ?? '', props.model_config.model ?? '')
})
</script>

<template>
  <div class="flex items-center gap-1">
    <a-trigger
      v-model:popup-visible="isModelListTriggerVisible"
      trigger="click"
      position="br"
      :unmount-on-close="false"
      :popup-translate="[0, 3]"
    >
      <div
        class="flex-1 flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-1.5 py-1 rounded-md border border-gray-200"
      >
        <a-avatar
          :size="14"
          shape="square"
          :image-url="`${BASE_URL}/llm-models/${model_config?.provider}/icon`"
          style="background-color: transparent"
        />
        <div class="flex-1 text-gray-700">{{ form?.model }}</div>
        <icon-down class="w-3 h-3 text-gray-500" />
      </div>
      <template #content>
        <div
          class="flex flex-col rounded-lg bg-white border border-gray-100 shadow-xl w-[400px] pb-1.5"
        >
          <div class="flex items-center text-gray-800 text-base font-semibold px-3.5 py-3">
            模型选择
          </div>
          <a-divider class="m-0" />
          <div class="h-[660px] overflow-y-scroll scrollbar-w-none">
            <div
              v-for="llmModel in llmModels"
              :key="llmModel.label"
              class="flex-1 flex flex-col px-2"
            >
              <div class="text-gray-500 text-xs font-medium px-2 py-1 mt-2">
                {{ llmModel.label }}
              </div>
              <div
                v-for="model in llmModel.models"
                :key="model.label"
                :class="`flex items-center hover:bg-gray-100 cursor-pointer px-2 rounded-lg duration-150 ${model.model_name == model_config?.model ? 'bg-blue-50' : ''}`"
                @click="handleSelectModel(llmModel.name, model.model_name)"
              >
                <a-avatar
                  :size="40"
                  shape="square"
                  :image-url="`${BASE_URL}/llm-models/${llmModel.name}/icon`"
                  style="background-color: transparent"
                  class="flex-shrink-0"
                />
                <div class="flex flex-col items-start ml-2 gap-1">
                  <div class="text-gray-800 font-semibold mt-1">{{ model.label }}</div>
                  <div class="flex items-center gap-1">
                    <div
                      v-for="(feature, idx) in model.features"
                      :key="idx"
                      class="text-[10px] text-gray-500 bg-gray-200 py-0.5 px-1 rounded-sm mt-0.5"
                    >
                      {{ llmTagMap[feature] }}
                    </div>
                  </div>
                  <a-popover
                    :content="model.description"
                    content-class="max-w-[220px]"
                    position="top"
                  >
                    <div class="text-gray-400 text-xs line-clamp-1 my-0.5">
                      {{ model.description }}
                    </div>
                  </a-popover>
                  <div class="w-full border-b border-gray-100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </a-trigger>
    <a-trigger
      v-model:popup-visible="isParametersTriggerVisible"
      trigger="click"
      position="br"
      :unmount-on-close="false"
      :popup-translate="[0, 3]"
      @hide="updateParameters"
    >
      <a-button type="text" size="small">
        <template #icon><icon-settings class="text-gray-600 w-4 h-4" /></template>
      </a-button>
      <template #content>
        <div class="bg-white rounded-md border border-gray-100 shadow-xl">
          <div class="bg-white rounded-md p-4">
            <div class="text-gray-800 font-semibold">生成多样性</div>
            <div
              v-for="parameter in llmModel?.parameters.filter((item) => item.name !== 'max_tokens')"
              :key="parameter.name"
              class="flex items-center gap-2 h-8 mt-4"
            >
              <!-- 字段标签 -->
              <div class="flex-1 flex items-center gap-3 text-gray-600 flex-shrink-0">
                <div class="text-sm">{{ parameter?.label }}</div>
                <a-popover :content="parameter?.help" content-class="max-w-[220px]">
                  <icon-question-circle />
                </a-popover>
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
                <div class="flex items-center gap-3 w-[300px]">
                  <a-slider
                    v-model:model-value="form.parameters[parameter.name]"
                    :default-value="parameter.default"
                    :min="parameter?.min"
                    :max="parameter?.max"
                    :step="parameter?.type === 'float' ? 0.1 : 1"
                    class="w-[160px] flex-shrink-0"
                  />
                  <a-input-number
                    size="small"
                    v-model:model-value="form.parameters[parameter.name]"
                    :default-value="parameter.default"
                    :min="parameter?.min"
                    :max="parameter?.max"
                    :step="parameter?.type === 'float' ? 0.1 : 1"
                    mode="button"
                    class="rounded-md"
                  ></a-input-number>
                </div>
              </template>
              <template v-else-if="parameter.type === 'string'">
                <a-input
                  v-model:model-value="form.parameters[parameter.name]"
                  :default-value="parameter.default"
                  placeholder="请输入参数值"
                />
              </template>
            </div>
          </div>
          <div class="bg-white rounded-md p-4">
            <div class="text-gray-800 font-semibold">输入及输出设置</div>
            <div class="flex items-center gap-3 h-8 mt-4">
              <div class="flex-1 flex items-center gap-2 text-gray-600 flex-shrink-0">
                <div class="text-sm">最大回复长度</div>
                <a-popover
                  content="控制模型输出的 Tokens 长度上限。通常 100 Tokens 约等于 150 个中文汉字。"
                  content-class="max-w-[220px]"
                >
                  <icon-question-circle />
                </a-popover>
              </div>
              <div v-if="form.parameters" class="flex items-center gap-3 w-[300px]">
                <a-slider
                  v-model:model-value="form.parameters['max_tokens']"
                  :default-value="maxTokensOption?.default || 1600"
                  :min="maxTokensOption?.min"
                  :max="maxTokensOption?.max"
                  :step="1"
                  class="w-[160px] flex-shrink-0"
                />
                <a-input-number
                  size="small"
                  v-model:model-value="form.parameters['max_tokens']"
                  :default-value="maxTokensOption?.default || 1600"
                  :min="maxTokensOption?.min"
                  :max="maxTokensOption?.max"
                  :step="1"
                  mode="button"
                  class="rounded-md"
                ></a-input-number>
              </div>
            </div>
          </div>
        </div>
      </template>
    </a-trigger>
  </div>
</template>

<style scoped></style>
