<script setup lang="ts">
import AccountApi from '@/services/api/account'
import type { GetPointsByDateRangeResp } from '@/services/api/account/types'
import { useAccountStore } from '@/stores/account'
import { formatDate } from '@/utils/format-util'
import { DeductFromText, formatNumberWithCommas } from '@/utils/util'
import moment from 'moment'
import { onUnmounted, ref, useTemplateRef, watch } from 'vue'
import PayConfirmModal from './components/PayConfirmModal.vue'

const activatedTab = ref('recharge')
const payChannel = ref('wechat')
const store = useAccountStore()
const formData = ref({ amount: 10 })
const rechargePoints = ref(0)
const loading = ref(false)
const pointsRecords = ref<GetPointsByDateRangeResp>()
const now = moment()
const startDate = now.startOf('month').format('YYYY-MM-DD')
const endDate = now.endOf('month').format('YYYY-MM-DD')
const dateRange = ref([startDate, endDate])
const formRef = useTemplateRef('formRef')
const payConfirmVisible = ref(false)

const getRechargeAccount = () => {
  if (store.account.phone_number) {
    return store.account.phone_number
  } else if (store.account.email) {
    return store.account.email
  } else {
    return store.account.name
  }
}

const handleTabClick = async (key: string) => {
  if (key == 'pointsRecord') {
    await handleRecharge()
    document.title = '积分记录 - 虎子'
  }
  if (key == 'recharge') {
    document.title = '积分充值 - 虎子'
  }
}

const handleRecharge = async () => {
  try {
    loading.value = true
    const resp = await AccountApi.getPointsByDateRange({
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      include_details: true,
    })
    pointsRecords.value = resp.data
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const onChange = (dateString: string, date: Date) => {
  handleRecharge()
}

const handlePay = async () => {
  const errors = await formRef.value.validate()
  if (errors) return

  payConfirmVisible.value = true
}

const stop = watch(
  () => formData.value.amount,
  () => {
    rechargePoints.value = Math.ceil((formData.value.amount / 4.8) * 1000)
  },
  { immediate: true },
)

onUnmounted(() => {
  stop()
})
</script>

<template>
  <div class="flex flex-col h-full w-full max-w-[1448px] mx-auto overflow-hidden">
    <a-tabs
      v-model:active-key="activatedTab"
      :header-padding="false"
      type="text"
      class="flex flex-col w-full mt-6"
      @tab-click="handleTabClick"
    >
      <a-tab-pane key="recharge" title="积分充值" class="">
        <div class="flex flex-col h-full w-full px-4">
          <div class="flex items-center py-4">
            <div class="text-gray-800 font-semibold w-[100px]">充值账户</div>
            <div class="text-gray-600">{{ getRechargeAccount() }}</div>
          </div>
          <div class="flex items-center py-4">
            <div class="text-gray-800 font-semibold w-[100px]">可用积分</div>
            <div class="text-gray-600 font-medium">
              {{ formatNumberWithCommas(store.points) }}
            </div>
          </div>
          <div class="flex items-start py-4">
            <div class="text-gray-800 font-semibold w-[100px] leading-[34px]">充值金额</div>
            <div class="flex items-start">
              <a-form ref="formRef" :model="formData" :style="{ width: '600px' }">
                <a-form-item
                  field="amount"
                  hide-label
                  :rules="[{ required: true, message: '充值金额不能为空' }]"
                  :validate-trigger="['change', 'input']"
                  class="m-0"
                >
                  <a-input-number
                    v-model="formData.amount"
                    :style="{ width: '320px' }"
                    placeholder="充值金额"
                    allow-clear
                    hide-button
                    :min="0.01"
                    :precision="2"
                    :step="0.01"
                    class="border border-gray-200 pr-0 focus-within:border-blue-600"
                    model-event="input"
                  >
                    <template #suffix>
                      <div
                        class="text-gray-600 bg-gray-200 h-[32px] w-[38px] leading-[32px] text-center rounded-r-sm"
                      >
                        元
                      </div>
                    </template>
                  </a-input-number>
                  <template #extra>
                    <div
                      v-if="formData.amount"
                      class="flex items-center text-gray-400 text-xs mt-1"
                    >
                      充值金额最小 0.01 元 ，{{ formData.amount }} 元 = {{ rechargePoints }} 积分
                    </div>
                  </template>
                </a-form-item>
              </a-form>
            </div>
          </div>
          <div class="flex items-center py-4">
            <div class="text-gray-800 font-semibold w-[100px]">支付方式</div>
            <div class="flex items-center gap-5">
              <div
                :class="`flex items-center gap-2 border rounded-sm px-3 py-2 cursor-pointer w-[116px] ${payChannel == 'wechat' ? 'border-blue-600' : 'border-gray-200'}`"
                @click="payChannel = 'wechat'"
              >
                <icon-wechatpay class="w-6 h-auto text-green-500" />
                <div class="text-gray-600">微信支付</div>
              </div>
              <a-tooltip content="暂不支持支付宝">
                <div
                  :class="`flex items-center gap-2 border rounded-sm px-3 py-2 cursor-not-allowed w-[116px] ${payChannel == 'alipay' ? 'border-blue-600' : 'border-gray-200'} bg-gray-200`"
                >
                  <icon-alipay-circle class="w-6 h-auto text-gray-500" />
                  <div class="text-gray-600">支付宝</div>
                </div>
              </a-tooltip>
            </div>
          </div>
          <div class="text-gray-400 pl-[100px] py-3">
            网上银行交易限额的问题，请前往相应的网上银行进行调整。目前不支持信用卡支付。
          </div>
          <div class="pl-[100px] mt-12">
            <a-button type="primary" class="rounded-md" @click="handlePay">立即充值</a-button>
          </div>
        </div>
      </a-tab-pane>
      <a-tab-pane key="pointsRecord" title="积分记录" class="">
        <div class="flex flex-col h-full w-full px-4">
          <div class="flex items-center justify-between">
            <div class="text-gray-500 ml-2">
              用量汇总: 共消耗 {{ pointsRecords?.total_deduct }} 积分
            </div>
            <a-range-picker v-model="dateRange" @change="onChange" class="rounded-md" />
          </div>
          <a-table
            hoverable
            :data="pointsRecords?.details"
            :bordered="{ wrapper: false }"
            :loading="loading"
            :show-footer="false"
            :pagination="false"
            class="mt-4"
          >
            <template #columns>
              <a-table-column
                title="项目"
                data-index="app_name"
                :width="260"
                header-cell-class="rounded-tl-lg bg-gray-200 text-gray-700"
                body-cell-class="bg-transparent"
              >
                <template #cell="{ record }">
                  <div class="flex items-center gap-2">
                    <a-avatar
                      :size="28"
                      shape="square"
                      :image-url="record?.app_icon"
                      class="flex-shrink-0 bg-transparent"
                    />
                    <div class="line-clamp-1">{{ record.app_name }}</div>
                  </div>
                </template>
              </a-table-column>
              <a-table-column
                title="项目类型"
                data-index="deduct_from"
                header-cell-class=" bg-gray-200 text-gray-700"
                body-cell-class="bg-transparent"
              >
                <template #cell="{ record }">
                  {{
                    DeductFromText.MAP[record.deduct_from as keyof typeof DeductFromText.MAP] ||
                    '未知类型'
                  }}
                </template>
              </a-table-column>
              <a-table-column
                title="积分变动"
                data-index="points_amount"
                header-cell-class=" bg-gray-200 text-gray-700"
                body-cell-class="bg-transparent"
              >
                <template #cell="{ record }">
                  <div class="font-semibold text-amber-500">{{ record.points_amount }}</div>
                </template>
              </a-table-column>
              <a-table-column
                title="变动描述"
                data-index="transaction_desc"
                header-cell-class=" bg-gray-200 text-gray-700"
                body-cell-class="bg-transparent"
              >
                <template #cell="{ record }">
                  <div class="">{{ record.transaction_desc }}</div>
                </template>
              </a-table-column>
              <a-table-column
                title="变动时间"
                data-index="created_at"
                header-cell-class="rounded-tr-lg bg-gray-200 text-gray-700"
                body-cell-class="bg-transparent"
              >
                <template #cell="{ record }">
                  <div class="">{{ formatDate(record.created_at, 'YYYY-MM-DD HH:mm:ss') }}</div>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>
    <PayConfirmModal
      v-model:visible="payConfirmVisible"
      :pay-channel="payChannel"
      :amount="formData.amount"
      :recharge-points="rechargePoints"
    />
  </div>
</template>

<style scoped>
:deep(.arco-tabs-tab) {
  font-size: 18px;
}
</style>
