<script setup lang="ts">
defineProps({
  placeholder: {
    type: String,
    default: '请输入搜索内容',
  },
})
const searchWord = defineModel<string>('searchWord', { default: () => '' })
</script>

<template>
  <a-input
    v-model="searchWord"
    :placeholder="placeholder"
    class="w-[200px] bg-white rounded-lg border-gray-300 focus-within:border-blue-700"
    allow-clear
    @search="$emit('update:searchWord', searchWord)"
  >
    <template #prefix>
      <img src="@/assets/images/icon-search.png" class="w-4 h-4" />
    </template>
  </a-input>
</template>

<style scoped></style>
