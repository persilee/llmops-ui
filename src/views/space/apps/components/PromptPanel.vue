<script setup lang="ts">
import DotCursor from '@/components/DotCursor.vue'
import AIApi from '@/services/api/ai'
import { Theme } from '@/types/types'
import CodeEditor from '@/views/components/CodeEditor.vue'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useAppStore } from '../AppView.store'

// 用户输入的提示词内容
const inputValue = ref('')
// 存储输入框或自动优化的提示词，便于再次生成使用
const inputPrompt = ref('')
// 控制优化弹窗的显示状态
const visible = ref(false)
// 原始提示词内容
const prompt = ref('')
// 存储优化后的提示词内容
const optimizePrompt = ref('')
// 应用状态管理store实例
const store = useAppStore()
// 优化过程的加载状态
const optimizeLoading = ref(false)
// 控制输入光标的显示状态
const isCursor = ref(false)
// 控制自动优化按钮的显示状态
const isShowAutoOptimizeBtn = ref(false)
// 控制操作按钮组的显示状态
const isShowBtns = ref(false)
// 输入框的DOM引用
const inputRef = useTemplateRef('inputRef')
// 更新提示词的加载状态
const updatePromptLoading = ref(false)
// 获取复制内容的DOM元素引用
const contentToCopy = useTemplateRef('contentToCopy')
// 计算属性：判断是否显示自动优化按钮
const isShowAutoOptimize = computed(() => {
  return store.app && store.app.description && isShowAutoOptimizeBtn.value
})
// 计算属性：判断输入框是否禁用（空值时禁用）
const isDisabled = computed(() => {
  return inputValue.value.trim() == ''
})

/**
 * 处理自动优化提示词的操作
 * 当满足自动优化条件时，使用应用的描述作为输入进行提示词优化
 * @returns Promise<void> 返回一个Promise，表示异步操作完成
 */
const handleAutoOptimize = async () => {
  if (isShowAutoOptimize.value) {
    isShowAutoOptimizeBtn.value = false
    optimizePromptFn(store.app!.description)
  }
}

/**
 * 处理手动优化提示词的操作
 * 当用户输入提示词并点击发送或按回车时触发
 * @returns Promise<void> 返回一个Promise，表示异步操作完成
 */
const handleOptimizePrompt = async () => {
  if (!isDisabled.value) {
    // 保存当前输入的提示词
    inputPrompt.value = inputValue.value
    // 清空输入框
    inputValue.value = ''
    // 调用优化函数处理提示词
    optimizePromptFn(inputPrompt.value)
  }
}

/**
 * 处理重新生成提示词的操作
 * 根据是否存在之前输入的提示词来决定使用哪种优化方式
 * 如果存在之前输入的提示词，则使用该提示词重新优化
 * 如果不存在，则触发自动优化功能
 * @returns Promise<void> 返回一个Promise，表示异步操作完成
 */
const handleRegenerate = async () => {
  if (inputPrompt.value) {
    optimizePromptFn(inputPrompt.value)
  } else {
    optimizePrompt.value = ''
    handleAutoOptimize()
  }
}

/**
 * 优化提示词的核心函数
 * 调用AI API对输入的提示词进行优化，并实时显示优化结果
 * @param prompt 需要优化的原始提示词
 * @returns Promise<void> 返回一个Promise，表示异步操作完成
 */
const optimizePromptFn = async (prompt: string) => {
  try {
    // 设置加载状态，显示加载动画
    optimizeLoading.value = true
    isCursor.value = true
    // 调用AI优化API，使用流式响应实时更新优化结果
    await AIApi.optimizePrompt({ prompt: prompt }, (eventResp) => {
      // 获取当前返回的优化片段
      const data = eventResp.data.optimize_prompt
      // 根据是否有数据控制光标显示状态
      isCursor.value = data == '' ? false : true
      // 累积优化结果
      optimizePrompt.value += data
      // 当优化完成（有内容且当前片段为空）时显示操作按钮
      if (optimizePrompt.value.trim() != '' && data == '') {
        isShowBtns.value = true
      }
    })
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  } finally {
    // 无论成功失败，都要重置加载状态
    optimizeLoading.value = false
  }
}

/**
 * 处理打开优化提示词弹窗的操作
 * 当用户点击优化按钮时，显示优化提示词的弹窗界面
 */
const handleOptimize = () => {
  visible.value = true
}

/**
 * 更新提示词配置
 * 将优化后的提示词更新到应用配置中，并刷新本地配置
 * @returns Promise<void> 返回一个Promise，表示异步操作完成
 */
const updatePrompt = async () => {
  // 检查必要的条件：应用存在、应用ID存在、优化后的提示词不为空
  if (optimizePrompt.value) {
    try {
      // 设置加载状态，显示加载动画
      updatePromptLoading.value = true
      // 调用API更新应用的草稿配置，传入优化后的提示词
      const resp = await store.updateDraftAppConfig({
        preset_prompt: optimizePrompt.value,
      })
      if (resp) {
        prompt.value = optimizePrompt.value
        handleCancelOptimize()
        Message.success(resp.message)
      }
    } catch (error) {
      // 错误处理：捕获并处理可能出现的异常
    } finally {
      // 无论成功失败，都要重置加载状态
      updatePromptLoading.value = false
    }
  }
}

/**
 * 处理文本框失去焦点事件
 * 当用户编辑完提示词并点击其他地方时触发
 * 检查提示词内容是否发生变化，如果有变化则更新到应用配置中
 * @returns Promise<void> 返回一个Promise，表示异步操作完成
 */
const handleBlur = async () => {
  // 比较当前提示词内容与草稿配置中的内容是否一致
  if (prompt.value.trim() != store.draftAppConfig.preset_prompt.trim()) {
    // 如果内容不一致，则更新草稿配置
    await store.updateDraftAppConfig({
      preset_prompt: prompt.value,
    })
  }
}

/**
 * 复制优化后的提示词内容到剪贴板
 * 获取指定DOM元素的文本内容，并使用浏览器的剪贴板API进行复制
 * 复制完成后显示相应的成功或失败提示消息
 * @returns Promise<void> 返回一个Promise，表示异步操作完成
 */
const copyToClipboard = async () => {
  try {
    // 检查目标元素是否存在，如果不存在则直接返回
    if (!contentToCopy.value) return
    // 获取div内的文本内容，优先使用textContent，如果不存在则使用innerText作为备选
    const text = contentToCopy.value.textContent || contentToCopy.value.innerText

    // 使用Clipboard API将文本复制到剪贴板
    await navigator.clipboard.writeText(text)

    // 复制成功时显示成功提示消息
    Message.success('复制成功')
  } catch (err) {
    // 复制失败时捕获错误并显示失败提示消息
    Message.error('复制失败' + err)
  }
}

/**
 * 处理取消优化操作
 * 关闭优化弹窗并重置相关数据状态
 */
const handleCancelOptimize = () => {
  visible.value = false // 关闭弹窗
  resetData() // 重置优化相关的数据状态
}

/**
 * 重置优化提示词相关的状态
 * 清空优化后的提示词内容
 * 隐藏操作按钮
 * 隐藏输入光标
 */
const resetData = () => {
  optimizePrompt.value = ''
  inputPrompt.value = ''
  isShowBtns.value = false
  isCursor.value = false
  isShowAutoOptimizeBtn.value = false
}

// TODO: 弹窗关闭前要提示用户是否要放弃优化后的提示词
// 监听弹窗显示状态
const stop = watch(
  () => visible.value, // 监听visible的值
  (newVal) => {
    // 回调函数，接收新值
    if (newVal) {
      // 当弹窗显示时
      resetData() // 重置数据状态
      isShowAutoOptimizeBtn.value = true
      setTimeout(() => {
        // 延时执行
        inputRef.value?.focus() // 聚焦输入框
      }, 60) // 延时60ms确保DOM已更新
    }
  },
)

// 监听优化后的提示词内容
const stopPrompt = watch(
  () => store.draftAppConfig.preset_prompt,
  (newVal) => {
    prompt.value = newVal
  },
)

onMounted(() => {
  // 组件挂载时，初始化提示词内容
  prompt.value = store.draftAppConfig.preset_prompt
})

/**
 * 组件卸载时的生命周期钩子
 * 清理资源，停止watch监听器，防止内存泄漏
 */
onUnmounted(() => {
  stop() // 组件卸载时停止监听
  stopPrompt() // 组件卸载时停止监听
})
</script>

<template>
  <div class="flex flex-col flex-1 border-r border-gray-200">
    <!-- 标题和按钮 -->
    <div class="flex items-center justify-between h-10 px-6">
      <div class="font-bold text-gray-900">人设与回复逻辑</div>
      <a-trigger
        v-model:popup-visible="visible"
        trigger="click"
        :unmount-on-close="false"
        position="bl"
        :popup-translate="[0, 8]"
      >
        <a-tooltip content="自动优化提示词">
          <a-button
            type="text"
            size="mini"
            class="text-gray-500 font-bold text-sm"
            @click="handleOptimize"
          >
            <template #icon>
              <img src="@/assets/images/icon-optimize.svg" class="w-4 h-4" />
            </template>
            优化
          </a-button>
        </a-tooltip>
        <template #content>
          <div class="bg-white rounded-xl shadow-xl p-4 w-[460px] max-h-[480px]">
            <div class="flex flex-col gap-2 h-full">
              <!-- 按钮 -->
              <div v-if="isShowAutoOptimize" class="flex items-center">
                <a-button
                  type="outline"
                  :loading="optimizeLoading"
                  class="border-gray-500 bg-gray-200 text-gray-900 rounded-full"
                  @click="handleAutoOptimize"
                  >自动优化</a-button
                >
              </div>
              <!-- 提示词优化后的结果 -->
              <div v-else class="flex flex-1 flex-col">
                <div
                  ref="contentToCopy"
                  class="text-gray-500 flex-1 max-h-[330px] overflow-y-scroll scrollbar-w-none leading-6.5"
                >
                  {{ optimizePrompt }}
                  <DotCursor v-if="isCursor" />
                </div>
                <Transition name="fade">
                  <div v-if="isShowBtns" class="flex items-center justify-between h-10 pt-2">
                    <div class="flex gap-2">
                      <a-button
                        type="primary"
                        size="small"
                        :loading="updatePromptLoading"
                        @click="updatePrompt"
                        >替换</a-button
                      >
                      <a-button size="small" @click="handleCancelOptimize">退出</a-button>
                    </div>
                    <div class="flex gap-2">
                      <a-tooltip content="复制" content-class="rounded-lg py-1">
                        <a-button
                          type="text"
                          size="small"
                          class="text-gray-600"
                          @click="copyToClipboard"
                        >
                          <template #icon><icon-copy /></template>
                        </a-button>
                      </a-tooltip>
                      <a-tooltip content="重新生成" content-class="rounded-lg py-1">
                        <a-button
                          type="text"
                          size="small"
                          class="text-gray-600"
                          @click="handleRegenerate"
                        >
                          <template #icon><icon-refresh /></template>
                        </a-button>
                      </a-tooltip>
                    </div>
                  </div>
                </Transition>
              </div>
              <!-- 输入框 -->
              <div
                class="flex flex-shrink-0 items-center h-[46px] gap-2 px-4 border border-gray-200 rounded-full focus-within:border-blue-700"
              >
                <img src="@/assets/images/icon-optimize.svg" class="w-3.5 h-3.5" />
                <input
                  ref="inputRef"
                  v-model="inputValue"
                  type="text"
                  class="flex-1 outline-0"
                  placeholder="你希望如何编写或优化提示词？"
                  @keyup.enter="handleOptimizePrompt"
                  @keyup.enter.exact="handleOptimizePrompt"
                />
                <a-button
                  :disabled="isDisabled"
                  type="text"
                  shape="circle"
                  @click="handleOptimizePrompt"
                >
                  <template #icon
                    ><img
                      src="@/assets/images/icon-send.png"
                      :class="['w-4', 'h-4', { 'send-icon-active': !isDisabled }]"
                  /></template>
                </a-button>
              </div>
              <div class="text-center text-gray-500 text-xs">
                内容由AI生成，无法确保真实准确，仅供参考。
              </div>
            </div>
          </div>
        </template>
      </a-trigger>
    </div>
    <!-- 提示词文本框 -->
    <div class="flex-1 px-3 pb-4 h-[calc(100%-56px)]">
      <CodeEditor
        v-model:code="prompt"
        :is-plaintext="true"
        :is-hide-header="true"
        :is-simple-mode="true"
        :options="{ lineNumbers: 'off', language: 'markdown' }"
        :theme="Theme.github"
        placeholder="请输入提示词或点击优化自动生成提示词"
        class="flex-1 h-full"
        @blur="handleBlur"
      ></CodeEditor>
    </div>
  </div>
</template>

<style scoped>
.send-icon-active {
  filter: brightness(0) saturate(100%) invert(35%) sepia(96%) saturate(462%) hue-rotate(185deg)
    brightness(96%) contrast(95%);
}

:deep(.arco-textarea) {
  resize: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
