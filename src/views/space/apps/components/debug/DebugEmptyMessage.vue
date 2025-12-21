<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../AppView.store'

const isShowOpeningStatement = computed(() => {
  return store.app?.description || store.draftAppConfig.opening_statement
})

const emits = defineEmits(['selectOpeningQuestion'])

const store = useAppStore()
</script>

<template>
  <div class="flex-1 flex flex-col justify-center items-center">
    <!-- 图标 -->
    <AAvatar class="bg-white" :size="64" shape="square">
      <img :src="store.app?.icon" />
    </AAvatar>
    <!-- 名称 -->
    <div class="text-xl text-gray-900 font-semibold text-center mt-2">
      {{ store.app?.name }}
    </div>
    <!-- 开场白 -->
    <div
      v-if="isShowOpeningStatement"
      class="text-gray-700 bg-gray-100 p-4 rounded-lg mt-4 leading-5.5"
    >
      {{
        store.draftAppConfig.opening_statement
          ? store.draftAppConfig.opening_statement
          : store.app?.description
      }}
    </div>
    <!-- 建议问题 -->
    <div v-if="store.draftAppConfig.opening_questions.length > 0" class="mt-3">
      <span
        v-for="(question, idx) in store.draftAppConfig.opening_questions"
        :key="idx"
        class="border border-gray-200 rounded-lg py-1.5 px-3 cursor-pointer leading-5 inline-block hover:bg-gray-100 mb-1.5"
        @click="emits('selectOpeningQuestion', question)"
      >
        {{ question }}
      </span>
    </div>
  </div>
</template>

<style scoped></style>
