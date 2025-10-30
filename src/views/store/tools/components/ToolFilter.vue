<script setup lang="ts">
import type { GetCategoriesResp } from '@/services/api/builtin-tool/types'

const categories = defineModel<GetCategoriesResp[]>('categories', { default: () => [] })
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
    <a-input
      v-model="searchWord"
      name="search-tool"
      placeholder="搜索插件"
      class="w-[200px] bg-white rounded-lg border-gray-300 focus-within:border-blue-700"
      allow-clear
    >
      <template #prefix>
        <img src="@/assets/images/icon-search.png" class="w-4 h-4" />
      </template>
    </a-input>
  </div>
</template>

<style scoped></style>
