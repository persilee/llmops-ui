<script setup lang="ts">
import type { GetBuiltinAppCategoriesResp } from '@/services/api/builtin-app/types'
import type { GetCategoriesResp } from '@/services/api/builtin-tool/types'
import InputSearch from '@/views/components/InputSearch.vue'

const props = defineProps<{
  placeholder?: string
  categories: GetCategoriesResp[] | GetBuiltinAppCategoriesResp[]
}>()

const selectedCategory = defineModel<string>('selectedCategory', { default: () => '' })
const searchWord = defineModel<string>('searchWord', { default: () => '' })
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-2">
      <a-button
        class="rounded-lg text-gray-700 px-3"
        @click="selectedCategory = 'all'"
        :type="selectedCategory === 'all' ? 'secondary' : 'text'"
      >
        全部
      </a-button>
      <a-button
        v-for="item in categories"
        :key="item.category"
        :type="selectedCategory === item.category ? 'secondary' : 'text'"
        class="rounded-lg text-gray-700 px-3"
        @click="selectedCategory = item.category"
      >
        {{ item.name }}
      </a-button>
    </div>
    <InputSearch v-model:search-word="searchWord" :placeholder="placeholder ?? '搜索插件'" />
  </div>
</template>

<style scoped></style>
