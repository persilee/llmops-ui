<script setup lang="ts">
import PayApi from '@/services/api/pay'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  payChannel: string
  amount: number
}>()
const visible = defineModel('visible', { type: Boolean, default: false })
const loading = ref(false)
const payQrcodeUrl = ref('')
const isPaySuccess = ref(false)
const isTimeout = ref(false)
let pollTimer: number | null = null

const handleCloseModal = () => {
  visible.value = false
  payQrcodeUrl.value = ''
  isPaySuccess.value = false
  isTimeout.value = false
  if (pollTimer) {
    clearInterval(pollTimer)
  }
}

const fetchData = async () => {
  try {
    loading.value = true
    const resp = await PayApi.wechatPay({
      total_fee: props.amount.toString(),
    })
    payQrcodeUrl.value = resp.data.wechat_pay_url
    startPolling(resp.data.trade_no)
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const startPolling = async (orderNo: string) => {
  const startTime = Date.now() // 记录开始时间
  const TIMEOUT = 3 * 60 * 1000 // 3分钟超时时间（毫秒）
  pollTimer = setInterval(async () => {
    try {
      // 检查是否超时
      if (Date.now() - startTime > TIMEOUT) {
        isTimeout.value = true
        if (pollTimer !== null) {
          clearInterval(pollTimer)
        }
      }
      const resp = await PayApi.getPayStatus(orderNo)
      if (resp.data.pay_status == 'PAID') {
        isPaySuccess.value = true
        if (pollTimer !== null) {
          clearInterval(pollTimer)
        }
      }
    } catch (error) {}
  }, 2000)
}

const handleRefreshQrcode = () => {
  isTimeout.value = false
  fetchData()
}

const stop = watch(
  () => visible.value,
  (newVal) => {
    if (newVal) {
      fetchData()
    }
  },
)

onUnmounted(() => {
  stop()
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="700"
    :title="payChannel == 'wechat' ? '微信支付' : '支付宝支付'"
    :footer="false"
    :unmount-on-close="true"
    title-align="start"
    class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <div v-if="isPaySuccess" class="flex flex-col items-center">
      <icon-check size="50" class="bg-green-500 text-white rounded-full p-1 mt-6" />
      <div class="text-xl font-semibold mt-2 text-green-500">支付成功</div>
      <div class="text-gray-800 font-bold text-[38px] mt-10">￥{{ amount }}</div>

      <a-button
        type="outline"
        class="mt-16 mb-6 w-[200px] border-green-500 text-green-500"
        @click="handleCloseModal"
        >完成</a-button
      >
    </div>
    <div v-else class="flex flex-col items-start">
      <div class="pl-[200px]">
        <div class="font-semibold text-gray-700 py-2">虎子 · LLMOPS预付费充值</div>
        <div class="flex items-center gap-1 py-2">
          <div class="font-semibold text-gray-800">支付金额：</div>
          <div class="font-bold text-green-500 text-xl">￥{{ amount.toFixed(2) }}</div>
        </div>
      </div>
      <a-divider class="w-full my-4" />
      <div class="pl-[180px] mb-20">
        <div class="flex items-center gap-1">
          <a-spin :loading="loading" class="flex flex-col items-center mt-1">
            <div class="relative">
              <div v-if="!payQrcodeUrl" class="w-[240px] h-[240px]"></div>
              <a-image v-else :src="payQrcodeUrl" :preview="false" width="240" height="240" />
              <div
                v-if="isTimeout"
                class="absolute top-[17px] left-[17px] w-[206px] h-[206px] bg-white/70 z-10 backdrop-blur-xs"
              ></div>
              <icon-refresh
                v-if="isTimeout"
                size="60"
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 cursor-pointer z-20"
                @click="handleRefreshQrcode"
              />
            </div>
            <div class="text-xs text-white bg-green-500 rounded-xs w-[206px] py-1.5 text-center">
              请打开手机微信，扫一扫完成支付
            </div>
          </a-spin>

          <img src="@/assets/images/image-wxpay.png" class="w-[190px] translate-y-3" />
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped></style>
