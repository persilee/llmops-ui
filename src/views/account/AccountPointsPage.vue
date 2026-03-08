<script setup lang="ts">
import { useAccountStore } from '@/stores/account'
import { formatNumberWithCommas } from '@/utils/util'
import { onUnmounted, ref, watch } from 'vue'

const activatedTab = ref('recharge')
const payChannel = ref('wechat')
const store = useAccountStore()
const formData = ref({ amount: 10 })
const rechargePoints = ref(0)

const getRechargeAccount = () => {
  if (store.account.phone_number) {
    return store.account.phone_number
  } else if (store.account.email) {
    return store.account.email
  } else {
    return store.account.name
  }
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
              <a-form :model="formData" :style="{ width: '600px' }">
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
              <div
                :class="`flex items-center gap-2 border rounded-sm px-3 py-2 cursor-pointer w-[116px] ${payChannel == 'alipay' ? 'border-blue-600' : 'border-gray-200'}`"
                @click="payChannel = 'alipay'"
              >
                <icon-alipay-circle class="w-6 h-auto text-blue-500" />
                <div class="text-gray-600">支付宝</div>
              </div>
            </div>
          </div>
          <div class="text-gray-400 pl-[100px] py-3">
            网上银行交易限额的问题，请前往相应的网上银行进行调整。目前不支持信用卡支付。
          </div>
          <div class="pl-[100px] mt-12">
            <a-button type="primary" class="rounded-md">立即充值</a-button>
          </div>
        </div>
      </a-tab-pane>
      <a-tab-pane key="deduction" title="积分消耗" class=""></a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped>
:deep(.arco-tabs-tab) {
  font-size: 18px;
}
</style>
