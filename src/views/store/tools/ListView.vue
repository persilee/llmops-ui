<script setup lang="ts">
import { BASE_URL } from '@/config'
import BuiltinToolApi from '@/services/api/builtin-tool'
import type { GetBuiltinToolsResp, GetCategoriesResp } from '@/services/api/builtin-tool/types'
import moment from 'moment'
import { computed, onMounted, ref } from 'vue'

const categories = ref<Array<GetCategoriesResp>>([])
const providers = ref<Array<GetBuiltinToolsResp>>([])
const category = ref<string>('all')
const searchWord = ref<string>('')
const showIndex = ref<number>(-1)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

const filterProviders = computed(() => {
  return providers.value.filter((item) => {
    const matchCategory = category.value === 'all' || item.category === category.value
    const mathSearchWord =
      searchWord.value === '' || item.label.toLowerCase().includes(searchWord.value)

    return matchCategory && mathSearchWord
  })
})

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    const [categoriesResp, builtinToolsResp] = await Promise.all([
      BuiltinToolApi.getCategories(),
      BuiltinToolApi.getBuiltinTools(),
    ])

    categories.value = categoriesResp.data
    providers.value = builtinToolsResp.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load data'
    console.error('Error loading data:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <a-spin :loading="loading" class="block h-full w-full bg-gray-50">
    <div class="flex flex-col p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <a-avatar :size="32" class="bg-blue-700!">
            <icon-common :size="18" />
          </a-avatar>
          <div class="text-xl font-medium text-gray-900">插件广场</div>
        </div>
        <a-button
          type="primary"
          class="h-10 rounded-[10px] px-5 text-sm font-bold text-blue-700 bg-blue-100"
          >创建自定义插件</a-button
        >
      </div>
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <a-button
            class="rounded-lg text-gray-700 px-3"
            @click="category = 'all'"
            :type="category === 'all' ? 'secondary' : 'text'"
            >全部</a-button
          >
          <a-button
            v-for="item in categories"
            :key="item.category"
            :type="category === item.category ? 'secondary' : 'text'"
            class="rounded-lg text-gray-700 px-3"
            @click="category = item.category"
            >{{ item.name }}</a-button
          >
        </div>
        <a-input
          v-model="searchWord"
          name="search-tool"
          placeholder="搜索插件"
          class="w-[200px] bg-white rounded-lg border-gray-300 focus-within:border-blue-700"
        >
          <template #prefix>
            <img src="@/assets/images/icon-search.png" class="w-4 h-4" />
          </template>
        </a-input>
      </div>
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col :span="6" v-for="(provider, idx) in filterProviders" :key="provider.name">
          <a-card class="cursor-pointer rounded-lg" hoverable @click="showIndex = idx">
            <div class="flex items-center gap-3 mb-3">
              <a-avatar :size="40" shape="square" :style="{ background: provider.background }">
                <img
                  :src="`${BASE_URL}/builtin-tools/${provider.name}/icon`"
                  :alt="provider.name"
                />
              </a-avatar>
              <div class="flex flex-col">
                <div class="text-base text-gray-900 font-bold">{{ provider.label }}</div>
                <div class="text-xs text-gray-500 line-clamp-1">
                  提供商 {{ provider.name }} • {{ provider.tools.length }}
                </div>
              </div>
            </div>
            <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2">
              {{ provider.description }}
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-4 h-4 flex items-center justify-center rounded-full bg-blue-700">
                <img src="@/assets/images/icon-user.png" class="w-2 h-2" />
              </div>
              <div class="text-xs text-gray-400">
                作者 • 发布时间{{ moment(provider.created_at).format('MM-DD HH:mm') }}
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="24" v-if="filterProviders.length === 0">
          <a-empty
            description="未找到相关结果"
            class="h-[400px] flex flex-col items-center justify-center"
          />
        </a-col>
      </a-row>
    </div>
    <a-drawer
      :visible="showIndex != -1"
      :width="380"
      :footer="false"
      title="工具详情"
      :drawer-style="{ background: '#F9FAFB' }"
      @cancel="showIndex = -1"
    >
      <div class="" v-if="showIndex != -1">
        <div class="flex items-center gap-3 mb-3">
          <a-avatar
            :size="40"
            shape="square"
            :style="{ background: filterProviders[showIndex].background }"
          >
            <img
              :src="`${BASE_URL}/builtin-tools/${filterProviders[showIndex].name}/icon`"
              :alt="filterProviders[showIndex].name"
            />
          </a-avatar>
          <div class="flex flex-col">
            <div class="text-base text-gray-900 font-bold">
              {{ filterProviders[showIndex].label }}
            </div>
            <div class="text-xs text-gray-500 line-clamp-1">
              提供商 {{ filterProviders[showIndex].name }} •
              {{ filterProviders[showIndex].tools.length }}
            </div>
          </div>
        </div>
        <div class="leading-[18px] text-gray-500">
          {{ filterProviders[showIndex].description }}
        </div>
        <a-divider />
        <div class="flex flex-col">
          <div class="mb-3 text-xs text-gray-500">
            包含 {{ filterProviders[showIndex].tools.length }} 个工具
          </div>
          <a-card
            v-for="tool in filterProviders[showIndex].tools"
            :key="tool.name"
            class="cursor-pointer flex flex-col rounded-xl"
          >
            <div class="font-bold text-gray-900 mb-2">{{ tool.label }}</div>
            <div class="text-gray-500 text-xs">{{ tool.description }}</div>
            <div v-if="tool.inputs.length > 0" class="">
              <div class="flex items-center gap-2 my-4">
                <div class="text-xs text-gray-500 font-bold">参数</div>
                <hr class="flex-1 border-gray-200" />
              </div>
              <div class="flex flex-col gap-4">
                <div v-for="input in tool.inputs" :key="input.name" class="flex flex-col gap-2">
                  <div class="flex items-center gap-2 text-xs">
                    <div class="text-gray-900 font-bold">{{ input.name }}</div>
                    <div class="text-gray-500">{{ input.type }}</div>
                    <div class="text-red-700">{{ input.required ? '必填' : '' }}</div>
                  </div>
                  <div class="text-xs text-gray-500">{{ input.description }}</div>
                </div>
              </div>
            </div>
          </a-card>
        </div>
      </div>
    </a-drawer>
  </a-spin>
</template>

<style scoped></style>
