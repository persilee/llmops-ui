<script setup lang="ts">
import AccountApi from '@/services/api/account'
import UploadApi from '@/services/api/upload-file'
import { useAccountStore } from '@/stores/account'
import { Message, type FileItem, type RequestOption } from '@arco-design/web-vue'
import { onMounted, ref } from 'vue'
import AccountNameModel from './components/AccountNameModel.vue'
import MailModel from './components/MailModel.vue'
import PasswordModel from './components/PasswordModel.vue'
import PhoneNumberModel from './components/PhoneNumberModel.vue'

// 加载状态标识，用于显示加载动画
const loading = ref(false)
// 当前激活的设置选项卡，默认为'account'
const activeValue = ref('account')
// 当前正在编辑的字段标识
const editActive = ref('')
// 账户状态管理store实例
const store = useAccountStore()
const fileList = ref<FileItem[]>([])
const visibleName = ref(false)
const visiblePassword = ref(false)
const visibleMail = ref(false)
const visiblePhone = ref(false)

/**
 * 处理图片上传的异步函数
 * @param {RequestOption} option 上传配置对象
 * @param {FileItem} option.fileItem 要上传的文件项
 * @param {Function} option.onSuccess 上传成功时的回调函数
 * @param {Function} option.onError 上传失败时的回调函数
 * @returns {Promise<void>}
 */
const handleUpload = async (option: RequestOption) => {
  try {
    // 从option中解构出文件项和回调函数
    const { fileItem, onSuccess, onError } = option
    // 调用上传API上传图片
    const resp = await UploadApi.uploadImage(fileItem.file)
    // 检查上传响应状态
    if (resp.code == 'success') {
      store.account.avatar = resp.data.url
      await AccountApi.updateAvatar({ avatar: resp.data.url })
      // 调用成功回调
      onSuccess(resp)
    } else {
      // 上传失败，调用失败回调并显示错误信息
      onError(resp)
      Message.error(resp.message)
    }
  } catch (error) {
    // 捕获上传过程中的异常，显示通用错误信息
    Message.error('上传失败')
  }
}

/**
 * 处理删除上传的图标
 * @returns {boolean} 返回true表示允许删除
 */
const handleRemove = () => {
  store.account.avatar = '' // 清空表单中的图标URL
  return true // 允许删除操作
}

onMounted(() => {
  fileList.value = [{ uid: '1', url: store.account.avatar }]
})
</script>

<template>
  <div class="flex flex-1 flex-col p-6 max-w-[920px] mx-auto">
    <!-- 标题 -->
    <div class="text-lg font-bold text-gray-900 mb-4">账号设置</div>
    <div class="flex flex-col gap-3">
      <div class="self-center my-[60px]">
        <a-upload
          v-model:file-list="fileList"
          :limit="1"
          list-type="picture-card"
          accept="image/png, image/jpeg"
          image-preview
          :custom-request="handleUpload"
          :on-before-remove="handleRemove"
        ></a-upload>
      </div>
      <div class="flex items-center gap-2">
        <div class="text-gray-700 font-semibold w-[110px]">
          <icon-user class="text-base" />
          账号昵称：
        </div>
        <div class="text-blue-600 w-[160px] line-clamp-1 overflow-ellipsis">
          {{ store.account.name }}
        </div>
        <div class="flex-1 text-gray-500">用于在应用中展示的名称。</div>
        <a-button type="primary" size="small" @click="visibleName = true">修改</a-button>
      </div>
      <a-divider type="dashed" class="my-2.5"></a-divider>
      <div class="flex items-center gap-2">
        <div class="text-gray-700 font-semibold w-[110px]">
          <icon-lock class="text-base" />
          账号密码：
        </div>
        <div class="text-blue-600 w-[160px] line-clamp-1 overflow-ellipsis">******</div>
        <div class="flex-1 text-gray-500">安全性高的密码可以使帐号更安全。建议您定期更换密码。</div>
        <a-button type="primary" size="small" @click="visiblePassword = true">修改</a-button>
      </div>
      <a-divider type="dashed" class="my-2.5"></a-divider>
      <div class="flex items-center gap-2">
        <div class="text-gray-700 font-semibold w-[110px]">
          <icon-email class="text-base" />
          绑定邮箱：
        </div>
        <div class="text-blue-600 w-[160px] line-clamp-1 overflow-ellipsis">
          {{ store.account.email ?? '暂未绑定' }}
        </div>
        <div class="flex-1 text-gray-500">绑定邮箱后可用来账号登录，更改、找回帐号密码。</div>
        <a-button type="primary" size="small" @click="visibleMail = true">
          {{ store.account.email ? '修改' : '绑定' }}
        </a-button>
      </div>
      <a-divider type="dashed" class="my-2.5"></a-divider>
      <div class="flex items-center gap-2">
        <div class="text-gray-700 font-semibold w-[110px]">
          <icon-mobile class="text-base" />
          绑定手机号：
        </div>
        <div class="text-blue-600 w-[160px] line-clamp-1 overflow-ellipsis">
          {{ store.account.phone_number ?? '暂未绑定' }}
        </div>
        <div class="flex-1 text-gray-500">绑定的手机号可以用验证码快速登录、找回密码。</div>
        <a-button type="primary" size="small" @click="visiblePhone = true">
          {{ store.account.phone_number ? '修改' : '绑定' }}
        </a-button>
      </div>
    </div>
    <AccountNameModel v-model:visible="visibleName" />
    <PasswordModel v-model:visible="visiblePassword" />
    <MailModel v-model:visible="visibleMail" />
    <PhoneNumberModel v-model:visible="visiblePhone" />
  </div>
</template>

<style scoped></style>
