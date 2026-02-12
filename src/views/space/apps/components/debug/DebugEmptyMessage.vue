<script setup lang="ts">
import { compact } from 'lodash-es'
import { computed } from 'vue'
import { useAppStore } from '../../AppView.store'

// 定义组件的props类型
const props = defineProps<{
  icon?: string // 可选的应用图标
  name?: string // 可选的应用名称
  openingStatement?: string // 可选的开场白文本
  openingQuestions?: string[] // 可选的开场问题列表
}>()
// 计算属性：判断是否显示开场白
// 当应用有描述或草稿配置中有开场白时返回true
const isShowOpeningStatement = computed(() => {
  return store.app?.description || store.draftAppConfig.opening_statement
})

// 定义组件的事件：选择开场问题
const emits = defineEmits(['selectOpeningQuestion'])

// 初始化应用状态store
const store = useAppStore()

// 计算属性：处理应用的开场问题列表
// 从props或store中获取opening_questions配置，并使用compact过滤掉空值
const hasOpeningQuestions = computed(() => {
  const questions = props.openingQuestions ?? store.draftAppConfig.opening_questions
  return compact(questions)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full max-w-[780px] mx-auto">
    <div class="flex-1 flex flex-col justify-center items-center w-fit">
      <!-- 图标 -->
      <a-avatar :size="64" shape="square" style="background-color: transparent">
        <img :src="icon ?? store.app?.icon" />
      </a-avatar>
      <!-- 名称 -->
      <div class="text-xl text-gray-900 font-semibold text-center mt-2">
        {{ name ?? store.app?.name }}
      </div>
      <!-- 开场白 -->
      <div
        v-if="openingStatement"
        class="text-gray-700 bg-white border border-gray-100 p-4 rounded-lg mt-4 leading-5.5"
        v-html="openingStatement"
      ></div>
      <div
        v-else-if="isShowOpeningStatement"
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
          class="bg-white border border-gray-100 rounded-lg py-1.5 px-3 cursor-pointer leading-5 hover:bg-gray-100 mb-1.5 w-fit"
          @click="emits('selectOpeningQuestion', question)"
        >
          {{ question }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
