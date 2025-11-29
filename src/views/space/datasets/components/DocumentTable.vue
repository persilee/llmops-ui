<script setup lang="ts">
import type { GetDocumentsWithPage } from '@/services/api/dataset/documents/type'
import { formatDate } from '@/utils/format-util'

// 定义组件属性
const props = defineProps({
  documents: {
    type: Array<GetDocumentsWithPage>,
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
const emit = defineEmits(['page-change', 'select', 'switch-change', 'row-click'])

// 处理分页变化
const handlePageChange = (page: number) => {
  emit('page-change', page)
}

/**
 * 处理下拉菜单选择事件
 * @param v 选中的操作值（如 'rename' 或 'delete'）
 * @param document 当前操作的文档对象
 */
const handleSelect = (v: string, document: GetDocumentsWithPage) => {
  emit('select', v, document)
}

/**
 * 处理表格行点击事件
 * @param document 被点击的文档对象
 */
const handleRowClick = (document: GetDocumentsWithPage) => {
  emit('row-click', document)
}

/**
 * 获取文档状态显示内容
 * @param document 文档对象
 * @returns 返回状态描述文本
 */
const getContent = (document: GetDocumentsWithPage) => {
  if (document.error != '' && document.status != 'completed') {
    return `错误：${document.error},状态：${document.status}`
  } else if (document.error != '') {
    return `错误：${document.error}`
  } else if (document.status != 'completed') {
    return `状态：${document.status}`
  } else {
    return `不可用状态`
  }
}

/**
 * 处理开关状态变更事件
 * @param v 开关的新状态值
 * @param document 当前操作的文档对象
 */
const handleChange = (v: string | number | boolean, document: GetDocumentsWithPage) => {
  emit('switch-change', v, document)
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
    @row-click="handleRowClick"
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
            <a-tooltip
              v-if="record.status != 'completed' || record.error != ''"
              :content="getContent(record)"
            >
              <a-switch
                size="small"
                type="round"
                :checked-value="!record.enabled"
                disabled
              ></a-switch>
            </a-tooltip>
            <a-switch
              v-else
              v-model:model-value="record.enabled"
              size="small"
              type="round"
              @change="(v) => handleChange(v, record)"
            ></a-switch>
            <a-dropdown position="br" @select="(v: string) => handleSelect(v, record)">
              <a-button type="text" size="mini" class="text-gray-700">
                <template #icon><icon-more /></template>
              </a-button>
              <template #content>
                <a-doption value="rename">重命名</a-doption>
                <a-doption value="delete" class="text-red-700">删除</a-doption>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </a-table-column>
    </template>
  </a-table>
</template>
