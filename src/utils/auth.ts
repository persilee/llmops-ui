import type { AuthorizeResp } from '@/services/api/account/types'
import * as Storage from '@/utils/storage'
/**
 * 认证工具模块
 * 提供用户登录状态检查等功能
 */
export default {
  /**
   * 检查用户是否已登录
   * @returns {boolean} 如果用户已登录且凭证未过期返回 true，否则返回 false
   */
  isLogin: () => {
    // 从存储中获取用户凭证
    const value = Storage.get('credential', {} as { credential?: AuthorizeResp }).value

    if (!value?.credential) {
      return false
    }

    const credential = value.credential
    // 获取当前时间戳（秒）
    const now = Math.floor(Date.now() / 1000)

    // 检查凭证是否有效
    if (!credential.access_token || !credential.expire_at || credential.expire_at < now) {
      // 清除无效的存储数据
      Storage.clear()
      return false
    }

    return true
  },
}
