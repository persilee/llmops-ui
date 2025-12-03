import type { AccountResp } from '@/services/api/account/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

// 初始化账户信息
const initAccount = <AccountResp>{}

/**
 * 账户状态管理 store
 * 用于管理用户的账户信息，包括账户数据的更新和重置
 */
export const useAccountStore = defineStore(
  'account',
  () => {
    // 账户信息状态
    const account = ref<AccountResp>(initAccount)

    /**
     * 更新账户信息
     * @param data 新的账户信息数据
     */
    const update = (data: AccountResp) => {
      account.value = data
    }

    /**
     * 重置账户信息到初始状态
     */
    const reset = () => {
      account.value = initAccount
    }

    return { account, update, reset }
  },
  {
    // 启用持久化存储
    persist: true,
  },
)
