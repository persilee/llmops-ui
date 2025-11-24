<script setup lang="ts">
import { formatDate } from '@/utils/format-util'

// 定义组件属性
const props = defineProps({
  documents: {
    type: Array,
    default: () => [],
  },
  pagination: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

// 定义事件
const emit = defineEmits(['page-change'])

// 处理分页变化
const handlePageChange = (page: number) => {
  emit('page-change', page)
}
</script>

<template>
  <a-table
    hoverable
    :data="documents"
    :pagination="pagination"
    :bordered="{ wrapper: false }"
    @page-change="handlePageChange"
    :loading="loading"
  >
    <template #columns>
      <a-table-column
        title="#"
        data-index="position"
        :width="60"
        header-cell-class="rounded-tl-lg bg-gray-200 text-gray-700"
        body-cell-class="bg-transparent"
      />
      <a-table-column
        title="文档名"
        data-index="name"
        :width="400"
        header-cell-class="bg-gray-200 text-gray-700"
        body-cell-class="bg-transparent"
      >
        <template #cell="{ record }">
          <div class="line-clamp-1">{{ record.name }}</div>
        </template>
      </a-table-column>
      <a-table-column
        title="字符集"
        data-index="character_count"
        header-cell-class=" bg-gray-200 text-gray-700"
        body-cell-class="bg-transparent"
      >
        <template #cell="{ record }"> {{ (record.character_count / 1000).toFixed(1) }}k </template>
      </a-table-column>
      <a-table-column
        title="召回次数"
        data-index="hit_count"
        header-cell-class="bg-gray-200 text-gray-700"
        body-cell-class="bg-transparent"
      />
      <a-table-column
        title="上传时间"
        data-index="created_at"
        header-cell-class="bg-gray-200 text-gray-700"
        body-cell-class="bg-transparent"
      >
        <template #cell="{ record }">
          {{ formatDate(record.created_at, 'YYYY-MM-DD HH:mm:ss') }}
        </template>
      </a-table-column>
      <a-table-column
        title="状态"
        data-index="status"
        header-cell-class="bg-gray-200 text-gray-700"
        body-cell-class="bg-transparent"
      >
        <template #cell="{ record }">
          <a-space>
            <a-badge v-if="record.enabled" status="success" text="可用" />
            <a-badge v-else status="normal" text="已禁用" />
          </a-space>
        </template>
      </a-table-column>
      <a-table-column
        title="操作"
        data-index="operator"
        header-cell-class="rounded-tr-lg bg-gray-200 text-gray-700"
        body-cell-class="bg-transparent"
        :width="100"
      >
        <template #cell="{ record }">
          <a-space :size="0">
            <template #split>
              <a-divider direction="vertical" />
            </template>
            <a-switch size="small" type="round" :checked-value="!record.enabled"></a-switch>
            <a-dropdown position="br">
              <a-button type="text" size="mini" class="text-gray-700">
                <template #icon><icon-more /></template>
              </a-button>
              <template #content>
                <a-doption>重命名</a-doption>
                <a-doption class="text-red-700">删除</a-doption>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </a-table-column>
    </template>
  </a-table>
</template>
