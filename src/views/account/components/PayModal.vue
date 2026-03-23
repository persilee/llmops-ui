<script setup lang="ts">
import PayApi from '@/services/api/pay'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  payChannel: string
  amount: number
}>()
const visible = defineModel('visible', { type: Boolean, default: false })
const loading = ref(false)
const payQrcodeUrl = ref('')

const handleCloseModal = () => {
  visible.value = false
}

const fetchData = async () => {
  try {
    loading.value = true
    const resp = await PayApi.wechatPay({
      total_fee: props.amount.toString(),
    })
    payQrcodeUrl.value = resp.data.wechat_pay_url
  } catch (error) {
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
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
    <div class="flex flex-col items-start">
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
          <div class="flex flex-col items-center mt-1">
            <a-image
              :src="payQrcodeUrl"
              :show-loader="true"
              :preview="false"
              width="240"
              height="240"
            />
            <div class="text-xs text-white bg-green-500 rounded-xs w-[206px] py-1.5 text-center">
              请打开手机微信，扫一扫完成支付
            </div>
          </div>
          <img src="@/assets/images/image-wxpay.png" class="w-[190px] translate-y-3" />
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped></style>
