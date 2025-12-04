<template>
  <footer class="copyright">
    <p class="copyright-text">&copy; {{ currentYear }} {{ author }}. All rights reserved.</p>
    <p class="copyright-info" v-if="showInfo">
      {{ infoText }}
    </p>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 组件属性
const props = defineProps({
  /** 版权所有者名称 */
  author: {
    type: String,
    required: true,
    default: 'Company Name',
  },
  /** 版权起始年份 */
  startYear: {
    type: Number,
    default: new Date().getFullYear(),
  },
  /** 显示额外信息 */
  showInfo: {
    type: Boolean,
    default: false,
  },
  /** 额外信息文本 */
  infoText: {
    type: String,
    default: '未经授权不得转载',
  },
})

// 计算当前年份
const currentYear = computed(() => {
  const year = new Date().getFullYear()
  // 如果起始年份和当前年份不同，显示年份范围
  return props.startYear === year ? year : `${props.startYear}-${year}`
})
</script>

<style scoped>
.copyright {
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
  color: #666;
  font-size: 0.9rem;
}

.copyright-text {
  margin: 0 0 0.2rem 0;
}

.copyright-info {
  margin: 0;
  font-size: 0.8rem;
  color: #999;
}
</style>
