import type { AuthorizeResp } from '@/services/api/account/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

// 初始化凭证信息
const initCredential = <AuthorizeResp>{}

/**
 * 凭证信息存储 store
 * 用于管理用户的认证凭证信息，支持持久化存储
 */
export const useCredentialStore = defineStore(
  'credential',
  () => {
    /** 凭证信息状态 */
    const credential = ref<AuthorizeResp>(initCredential)

    /**
     * 更新凭证信息
     * @param data 新的凭证信息
     */
    const update = (data: AuthorizeResp) => {
      credential.value = data
    }

    /**
     * 重置凭证信息为初始状态
     */
    const reset = () => {
      credential.value = initCredential
    }

    return {
      credential,
      update,
      reset,
    }
  },
  {
    /** 启用持久化存储 */
    persist: true,
  },
)
