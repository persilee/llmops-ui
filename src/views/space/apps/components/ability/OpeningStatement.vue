<script setup lang="ts">
import * as _ from 'lodash-es'
import { onMounted, ref } from 'vue'
import { useAppStore } from '../../AppView.store'

// 初始化应用状态管理store
const store = useAppStore()
// 定义响应式数组，用于存储开场白问题列表
const openingQuestions = ref<Array<string>>([])

/**
 * 处理开场白文案失去焦点的回调函数
 * 当用户编辑完开场白文案后，将更新后的内容保存到store中
 */
const handleBlur = () => {
  store.updateDraftAppConfig({ opening_statement: store.draftAppConfig.opening_statement })
}

/**
 * 处理删除开场白问题的函数
 * @param index 要删除的问题的索引
 */
const handleDelete = async (index: number) => {
  // 如果当前问题为空，直接返回，不执行删除操作
  if (openingQuestions.value[index].trim() == '') return

  // 从数组中删除指定索引的问题
  openingQuestions.value.splice(index, 1)
  // 更新配置，使用_.compact去除数组中的空值
  await store.updateDraftAppConfig({
    opening_questions: _.compact(openingQuestions.value),
  })
  // 如果删除后列表为空，添加一个空输入框以保持UI的可用性
  if (openingQuestions.value.length == 0) {
    openingQuestions.value.push('')
  }
}

/**
 * 处理开场白问题输入框输入事件的回调函数
 * @param index 当前输入框的索引
 */
const handleInput = (index: number) => {
  // 获取当前输入框的值并去除首尾空格
  const inputValue = openingQuestions.value[index].trim()
  // 检查是否所有输入框都有内容（非空字符串）
  const isAddItem = openingQuestions.value.every((item) => item != '')

  // 如果满足以下条件，则添加一个新的空输入框：
  // 1. 当前输入框有内容
  // 2. 所有现有输入框都有内容
  // 3. 输入框总数小于3（最多允许3个问题）
  if (inputValue && isAddItem && openingQuestions.value.length < 3) {
    openingQuestions.value.push('')
  }
}

/**
 * 处理开场白问题输入框失去焦点的回调函数
 * @param index 当前输入框的索引
 */
const handleOpeningQuestionsBlur = (index: number) => {
  // 获取当前输入框的值并去除首尾空格
  const currentValue = openingQuestions.value[index].trim()

  // 如果当前值为空或与原始值相同，则不需要更新
  if (currentValue == '' || currentValue == store.draftAppConfig.opening_questions[index]) return

  // 更新配置，使用_.compact去除数组中的空值
  store.updateDraftAppConfig({
    opening_questions: _.compact(openingQuestions.value),
  })
}

// 组件挂载时执行的钩子函数
onMounted(async () => {
  // 从store中获取已保存的开场白问题列表
  openingQuestions.value = store.draftAppConfig.opening_questions
  // 如果问题数量少于3个，添加一个空输入框供用户输入
  if (openingQuestions.value.length < 3) {
    openingQuestions.value.push('')
  }
})
</script>

<template>
  <a-collapse-item header="对话开场白" key="2">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <a-button @click.stop type="text" size="mini">
        <template #icon>
          <icon-plus class="text-gray-600" />
        </template>
      </a-button>
    </template>
    <!-- 内容 -->
    <div class="flex flex-col">
      <!-- 开场白文案 -->
      <div class="flex items-center gap-1">
        <div class="text-gray-600 text-xs">开场白文案</div>
        <a-tooltip content="开场白是和对话开始时，Agent自动发送给用户的文案。">
          <icon-info-circle class="text-gray-600" />
        </a-tooltip>
      </div>
      <a-textarea
        v-model="store.draftAppConfig.opening_statement"
        class="mt-3 bg-white border border-gray-200 rounded-lg focus-within:border-blue-600"
        placeholder="在此处填写 AI 应用的开场白"
        show-word-limit
        :auto-size="{ minRows: 4, maxRows: 4 }"
        :max-length="2000"
        @blur="handleBlur"
      ></a-textarea>

      <!-- 开场白预设问题 -->
      <div class="flex items-center gap-1 mt-4">
        <div class="text-gray-600 text-xs">开场白预设问题</div>
        <a-tooltip
          content="开场白预设问题是和Agent开始对话时，预设的引导问题列表，最多不能超过 3 个。"
        >
          <icon-info-circle class="text-gray-600" />
        </a-tooltip>
      </div>
      <div class="mt-3">
        <div
          v-for="(item, index) in openingQuestions"
          :key="index"
          class="flex items-center mb-3 rounded-lg bg-white border border-gray-200 focus-within:border-blue-600"
        >
          <a-input
            v-model="openingQuestions[index]"
            placeholder="输入开场白引导问题"
            class="bg-white border-0 rounded-lg"
            @input="handleInput(index)"
            @blur="handleOpeningQuestionsBlur(index)"
          >
          </a-input>
          <a-tooltip content="删除开场白问题">
            <a-button
              type="text"
              size="mini"
              :tabindex="-1"
              class="p-2 mr-1"
              @click.stop="handleDelete(index)"
            >
              <icon-delete class="text-gray-400" />
            </a-button>
          </a-tooltip>
        </div>
      </div>
    </div>
  </a-collapse-item>
</template>

<style scoped></style>
