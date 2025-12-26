<script setup lang="ts">
import { compact } from 'lodash-es'
import { computed } from 'vue'
import { useAppStore } from '../../AppView.store'

const isShowOpeningStatement = computed(() => {
  return store.app?.description || store.draftAppConfig.opening_statement
})

const emits = defineEmits(['selectOpeningQuestion'])

const store = useAppStore()

const hasOpeningQuestions = computed(() => {
  const questions = store.draftAppConfig.opening_questions
  return compact(questions)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full">
    <div class="flex-1 flex flex-col justify-center items-center w-fit">
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
      <div v-if="hasOpeningQuestions.length > 0" class="w-max mt-3 self-start">
        <div
          v-for="(question, idx) in hasOpeningQuestions"
          :key="idx"
          class="border border-gray-200 rounded-lg py-1.5 px-3 cursor-pointer leading-5 hover:bg-gray-100 mb-1.5 w-fit"
          @click="emits('selectOpeningQuestion', question)"
        >
          {{ question }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
