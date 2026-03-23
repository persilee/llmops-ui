<script setup lang="ts">
import { formatNumberWithCommas } from '@/utils/util'
import { ref } from 'vue'
import PayModal from './PayModal.vue'

const props = defineProps<{
  payChannel: string
  amount: number
  rechargePoints: number
}>()
const visible = defineModel('visible', { type: Boolean, default: false })
const payVisible = ref(false)

const handleCloseModal = () => {
  visible.value = false
}

const handleConfirm = () => {
  payVisible.value = true
  visible.value = false
}
</script>

<template>
  <a-modal
    :visible="visible"
    :width="700"
    title="确认充值"
    :footer="false"
    :unmount-on-close="true"
    title-align="start"
    class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <div class="flex flex-col items-center justify-center mt-3">
      <div class="w-[360px]">
        <div class="flex items-center justify-between py-4">
          <div class="font-semibold text-gray-600">充值方式：</div>
          <div class="flex items-center gap-2">
            <icon-wechatpay v-if="payChannel == 'wechat'" class="w-5 h-auto text-green-500" />
            <icon-alipay-circle v-else class="w-6 h-auto text-blue-500" />
            <div class="text-gray-600">
              {{ payChannel == 'wechat' ? '微信支付' : '支付宝' }}
            </div>
          </div>
        </div>
        <a-divider class="m-0" />
        <div class="flex items-center justify-between py-4">
          <div class="font-semibold text-gray-600">充值金额：</div>
          <div class="flex items-center gap-2">
            <div class="text-gray-600">￥ {{ amount.toFixed(2) }}</div>
          </div>
        </div>
        <a-divider class="m-0" />
        <div class="flex items-center justify-between py-4">
          <div class="font-semibold text-gray-600">到账积分：</div>
          <div class="flex items-center gap-2">
            <div class="text-gray-600">{{ formatNumberWithCommas(rechargePoints) }} 积分</div>
          </div>
        </div>
        <a-divider class="m-0" />
      </div>
      <div class="flex items-center justify-center mt-15 mb-5 gap-6">
        <a-button @click="handleCloseModal">取消</a-button>
        <a-button type="primary" @click="handleConfirm">确认充值</a-button>
      </div>
    </div>
  </a-modal>
  <PayModal v-model:visible="payVisible" :amount="amount" :pay-channel="payChannel" />
</template>

<style scoped></style>
