<script setup lang="ts">
import DropdownSwitch from '@/views/components/DropdownSwitch.vue'
import * as _ from 'lodash-es'
import { ref } from 'vue'
import { useAppStore } from '../../AppView.store'
import ReviewConfigModel from './ReviewConfigModel.vue'

const store = useAppStore()
const visible = ref(false)

const handleSelect = (val: boolean) => {
  const review_config = _.cloneDeep(store.draftAppConfig.review_config)
  review_config.enable = val
  store.updateDraftAppConfig({ review_config })
}

const handleSetting = () => {
  visible.value = true
}
</script>

<template>
  <a-collapse-item header="内容审查" key="ReviewConfig">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <DropdownSwitch
        v-model:value="store.draftAppConfig.review_config.enable"
        @select="handleSelect"
      />
    </template>
    <!-- 内容 -->
    <div v-if="store.draftAppConfig.review_config.enable" class="">
      <a-button
        long
        class="bg-white border border-gray-200 hover:bg-gray-200"
        @click="handleSetting"
      >
        <template #icon>
          <icon-settings />
        </template>
        设置
      </a-button>
    </div>
    <div v-else class="text-sm text-gray-500">对用户输入以及大语言模型输出进行内容审查</div>
    <!-- 内容审查弹窗 -->
    <ReviewConfigModel v-model:visible="visible" />
  </a-collapse-item>
</template>

<style scoped></style>
