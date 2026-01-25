<script setup lang="ts">
import AnalysisApi from '@/services/api/analysis'
import { formatDate } from '@/utils/format-util'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { useAppStore } from './AppView.store'
import OverviewIndicator from './components/OverviewIndicator.vue'

use([GridComponent, LineChart, CanvasRenderer, TooltipComponent])
const loading = ref(false)
const appAnalysis = ref<Record<string, any>>()
const store = useAppStore()

const trendOption = computed(() => {
  const fields = [
    'total_messages_trend',
    'active_accounts_trend',
    'avg_of_conversation_messages_trend',
    'cost_consumption_trend',
  ]

  if (!appAnalysis.value) {
    return fields.reduce(
      (acc, field) => {
        acc[field] = {}
        return acc
      },
      {} as Record<string, any>,
    )
  }

  const analysis = appAnalysis.value
  return fields.reduce(
    (acc, field) => {
      const fieldData = analysis[field]
      acc[field] = {
        grid: {
          top: 20,
          bottom: 20,
          left: 30,
          right: 30,
        },
        tooltip: {
          trigger: 'item',
          axisPointer: {
            type: 'shadow',
          },
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data:
            fieldData?.x_axis?.map((value: number) => {
              return formatDate(value, 'MM-DD')
            }) || [],
          splitLine: {
            show: true,
            lineStyle: {
              color: '#eeeeee',
              width: 1,
              type: 'solid',
            },
          },
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            data: fieldData?.y_axis || [],
            type: 'line',
          },
        ],
      }
      return acc
    },
    {} as Record<string, any>,
  )
})

const getAnalysisData = async () => {
  try {
    if (store.app && store.app.id) {
      loading.value = true
      const resp = await AnalysisApi.getAppAnalysis(store.app.id)
      appAnalysis.value = resp.data
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getAnalysisData()
})
</script>

<template>
  <div class="px-6 py-5 overflow-scroll scrollbar-w-none w-full min-w-[1400px]">
    <!-- 概览指标 -->
    <div class="flex flex-col gap-5 mb-5">
      <!-- 标题 -->
      <div class="flex items-baseline gap-1">
        <div class="text-base text-gray-700 font-semibold">概览指标</div>
        <div class="text-xs text-gray-500">(过去7天)</div>
      </div>
      <!-- 指标卡片 -->
      <a-spin :loading="loading">
        <div class="flex items-center gap-4">
          <OverviewIndicator
            title="全部会话数"
            help="反映 AI 每天的会话消息总数，在指定的时间范围内，用户对应用发起的请求总次数，一问一答记一次，用于衡量用户活跃度。"
            unit="次"
            :data="appAnalysis?.total_messages?.data"
            :pop="appAnalysis?.total_messages?.pop"
          >
            <template #icon>
              <img src="@/assets/images/icon-messages-total.png" class="w-4 h-4" />
            </template>
          </OverviewIndicator>
          <OverviewIndicator
            title="活跃用户数"
            help="指定的发布渠道和时间范围内，至少完成一轮对话的总使用用户数量，用于衡量应用吸引力。"
            unit="人"
            :data="appAnalysis?.active_accounts?.data"
            :pop="appAnalysis?.active_accounts?.pop"
          >
            <template #icon>
              <img src="@/assets/images/icon-accounts-active.png" class="w-4 h-4" />
            </template>
          </OverviewIndicator>
          <OverviewIndicator
            title="平均会话互动数"
            help="反映每个会话用户的持续沟通次数，如果用户与 AI 进行了 10 轮对话，即为 10，该指标反映了用户粘性。"
            unit="次"
            :data="appAnalysis?.avg_of_conversation_messages?.data"
            :pop="appAnalysis?.avg_of_conversation_messages?.pop"
          >
            <template #icon>
              <img src="@/assets/images/icon-avg-messages.png" class="w-4 h-4" />
            </template>
          </OverviewIndicator>
          <OverviewIndicator
            title="Token输出速度"
            help="衡量 LLM 的性能，统计 LLM 从请求到输出完毕这段期间内的 Tokens 输出速度。"
            unit="Ts/秒"
            :data="appAnalysis?.token_output_rate?.data"
            :pop="appAnalysis?.token_output_rate?.pop"
          >
            <template #icon>
              <img src="@/assets/images/icon-token-output.png" class="w-4 h-4" />
            </template>
          </OverviewIndicator>
          <OverviewIndicator
            title="费用消耗"
            help="反映每日该应用请求语言模型的 Tokens 花费，用于成本控制。"
            unit="RMB"
            :data="appAnalysis?.cost_consumption?.data"
            :pop="appAnalysis?.cost_consumption?.pop"
          >
            <template #icon>
              <img src="@/assets/images/icon-consumption-cost.png" class="w-4 h-4" />
            </template>
          </OverviewIndicator>
        </div>
      </a-spin>
    </div>
    <!-- 指标详情 -->
    <div class="flex flex-col gap-5">
      <!-- 标题 -->
      <div class="flex items-baseline gap-1">
        <div class="text-base text-gray-700 font-semibold">详细指标</div>
        <div class="text-xs text-gray-500">(过去7天)</div>
      </div>
      <!-- 可视化图表 -->
      <a-spin :loading="loading">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col bg-white rounded-lg border border-gray-200 p-4 h-[300px]">
            <!-- 标题 -->
            <div class="flex items-center gap-1 mb-1 flex-shrink-0">
              <div class="text-gray-700 font-bold">全部会话数</div>
              <a-popover
                content="反映 AI 每天的会话消息总数，在指定的时间范围内，用户对应用发起的请求总次数，一问一答记一次，用于衡量用户活跃度。"
                class="w-[220px]"
              >
                <icon-info-circle />
              </a-popover>
            </div>
            <!-- 副标题 -->
            <div class="text-gray-500 mb-1 flex-shrink-0">过去7天</div>
            <!-- 可视化图表 -->
            <div class="w-full flex-1">
              <v-chart
                :key="$route.path"
                :option="trendOption?.total_messages_trend"
                :autoresize="true"
              />
            </div>
          </div>
          <div class="flex flex-col bg-white rounded-lg border border-gray-200 p-4 h-[300px]">
            <!-- 标题 -->
            <div class="flex items-center gap-1 mb-1 flex-shrink-0">
              <div class="text-gray-700 font-bold">活跃用户数</div>
              <a-popover
                content="指定的发布渠道和时间范围内，至少完成一轮对话的总使用用户数量，用于衡量应用吸引力。"
                class="w-[220px]"
              >
                <icon-info-circle />
              </a-popover>
            </div>
            <!-- 副标题 -->
            <div class="text-gray-500 mb-1 flex-shrink-0">过去7天</div>
            <!-- 可视化图表 -->
            <div class="w-full flex-1">
              <v-chart
                :key="$route.path"
                :option="trendOption?.active_accounts_trend"
                :autoresize="true"
              />
            </div>
          </div>
          <div class="flex flex-col bg-white rounded-lg border border-gray-200 p-4 h-[300px]">
            <!-- 标题 -->
            <div class="flex items-center gap-1 mb-1 flex-shrink-0">
              <div class="text-gray-700 font-bold">平均会话互动数</div>
              <a-popover
                content="反映每个会话用户的持续沟通次数，如果用户与 AI 进行了 10 轮对话，即为 10，该指标反映了用户粘性。"
                class="w-[220px]"
              >
                <icon-info-circle />
              </a-popover>
            </div>
            <!-- 副标题 -->
            <div class="text-gray-500 mb-1 flex-shrink-0">过去7天</div>
            <!-- 可视化图表 -->
            <div class="w-full flex-1">
              <v-chart
                :key="$route.path"
                :option="trendOption?.avg_of_conversation_messages_trend"
                :autoresize="true"
              />
            </div>
          </div>
          <div class="flex flex-col bg-white rounded-lg border border-gray-200 p-4 h-[300px]">
            <!-- 标题 -->
            <div class="flex items-center gap-1 mb-1 flex-shrink-0">
              <div class="text-gray-700 font-bold">费用消耗</div>
              <a-popover
                content="反映每日该应用请求语言模型的 Tokens 花费，用于成本控制。"
                class="w-[220px]"
              >
                <icon-info-circle />
              </a-popover>
            </div>
            <!-- 副标题 -->
            <div class="text-gray-500 mb-1 flex-shrink-0">过去7天</div>
            <!-- 可视化图表 -->
            <div class="w-full flex-1">
              <v-chart
                :key="$route.path"
                :option="trendOption?.cost_consumption_trend"
                :autoresize="true"
              />
            </div>
          </div>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<style scoped></style>
