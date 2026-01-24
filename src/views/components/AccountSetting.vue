<script setup lang="ts">
import AccountApi from '@/services/api/account'
import UploadApi from '@/services/api/upload-file'
import { useAccountStore } from '@/stores/account'
import * as Storage from '@/utils/storage'
import { Message, type FileItem, type RequestOption } from '@arco-design/web-vue'
import { onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// 控制弹窗显示/隐藏的状态
const visible = defineModel('visible', { type: Boolean, default: false })
// 当前激活的设置选项卡，默认为'account'
const activeValue = ref('account')
// 账户状态管理store实例
const store = useAccountStore()
// 表单数据对象，包含用户账户信息
const formData = reactive({
  fileList: <FileItem>[], // 上传的文件列表
  name: '', // 用户昵称
  email: '', // 用户邮箱
  avatar: '', // 用户头像URL
  password: '', // 用户密码
})

// 当前正在编辑的字段标识
const editActive = ref('')
// 加载状态标识，用于显示加载动画
const loading = ref(false)
// Vue Router实例，用于路由导航
const router = useRouter()

/**
 * 处理保存昵称的异步函数
 * @returns {Promise<void>}
 */
const handleSaveName = async () => {
  try {
    // 开启加载状态
    loading.value = true
    // 调用API更新昵称
    const resp = await AccountApi.updateName({ name: formData.name })
    // 更新store中的昵称
    store.account.name = formData.name
    // 退出编辑状态
    editActive.value = ''
    // 显示修改成功提示
    Message.success(resp.message)
  } catch (error) {
    // 错误处理
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

/**
 * 处理保存密码的异步函数
 * @returns {Promise<void>}
 */
const handleSavePassword = async () => {
  try {
    // 开启加载状态
    loading.value = true
    // 调用API更新密码
    const resp = await AccountApi.updatePassword({ password: formData.password })
    // 退出编辑状态
    editActive.value = ''
    // 重置密码显示为星号
    formData.password = '******'
    // 显示修改成功提示
    Message.success('修改密码成功，请重新登录，即将跳转登录页...')
    // 清除存储的登录凭证
    Storage.remove('credential')
    // 延迟3秒后跳转到登录页
    setTimeout(() => {
      router.push({ name: 'auth-login' })
    }, 3000)
  } catch (error) {
    // 错误处理
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

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
      // 上传成功，保存图片URL到表单数据
      formData.avatar = resp.data.url
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
  formData.avatar = '' // 清空表单中的图标URL
  return true // 允许删除操作
}

/**
 * 处理关闭弹窗的函数
 * @returns {void}
 */
const handleClose = () => {
  visible.value = false
}

/**
 * 处理取消编辑的函数
 * @returns {void}
 */
const handleCancel = () => {
  editActive.value = ''
  updateFormData()
}

/**
 * 更新表单数据的异步函数
 * 从store中同步最新的账户信息到表单
 * @returns {Promise<void>}
 */
const updateFormData = async () => {
  Object.assign(formData, {
    fileList: [{ uid: '1', url: store.account.avatar }],
    name: store.account.name,
    email: store.account.email,
    avatar: store.account.avatar,
  })
}

/**
 * 监听弹窗显示状态的变化
 * 当弹窗打开时，更新表单数据
 */
const stop = watch(
  () => visible.value,
  (newVal) => {
    if (newVal) {
      Object.assign(formData, {
        fileList: [{ uid: '1', url: store.account.avatar }],
        name: store.account.name,
        email: store.account.email,
        avatar: store.account.avatar,
        password: '******',
      })
    }
  },
)

/**
 * 组件卸载时停止监听
 * @returns {void}
 */
onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-modal :visible="visible" :width="800" hide-title :footer="false" class="rounded-xl">
    <div class="flex h-[560px]">
      <!-- 左边导航 -->
      <div class="w-[186px] flex flex-col">
        <!-- 标题 -->
        <div class="text-lg font-bold text-gray-900">设置</div>
        <!-- 菜单选项 -->
        <div class="flex flex-col gap-2 mt-4 mr-5">
          <div
            :class="`text-gray-600 px-2 py-1.5 hover:bg-gray-100 rounded-lg cursor-pointer ${activeValue == 'account' ? 'bg-gray-100' : ''}`"
            @click="activeValue = 'account'"
          >
            账号设置
          </div>
        </div>
      </div>
      <!-- 右边内容 -->
      <div class="flex flex-1 flex-col pl-6 border-l border-l-gray-200">
        <!-- 标题 -->
        <div class="text-lg font-bold text-gray-900 mb-4">账号设置</div>
        <!-- 表单 -->
        <a-form :model="formData" layout="vertical">
          <a-spin :loading="loading">
            <a-form-item
              field="fileList"
              label="账号头像"
              asterisk-position="end"
              :rules="[{ required: true, message: '账号头像不能为空' }]"
            >
              <a-upload
                v-model:file-list="formData.fileList"
                :limit="1"
                list-type="picture-card"
                accept="image/png, image/jpeg"
                image-preview
                :custom-request="handleUpload"
                :on-before-remove="handleRemove"
              ></a-upload>
            </a-form-item>
            <a-form-item
              field="name"
              label="账号昵称"
              asterisk-position="end"
              :rules="[{ required: true, message: '账号昵称不能为空' }]"
            >
              <div v-if="editActive == 'name'" class="flex flex-1 items-center gap-3">
                <a-input v-model="formData.name" allow-clear />
                <a-button
                  type="outline"
                  @click="handleCancel"
                  class="text-gray-600 border border-gray-300"
                  >取消</a-button
                >
                <a-button type="primary" @click="handleSaveName">保存</a-button>
              </div>
              <div v-else class="flex items-center text-gray-500">
                {{ formData.name }}
                <img
                  src="@/assets/images/icon-edit.png"
                  class="h-4 ml-2 cursor-pointer"
                  @click="editActive = 'name'"
                />
              </div>
            </a-form-item>
            <a-form-item
              field="password"
              label="账号密码"
              asterisk-position="end"
              :rules="[{ required: true, message: '账号密码不能为空' }]"
            >
              <div v-if="editActive == 'password'" class="flex flex-1 gap-3">
                <a-input v-model="formData.password" default-value="******" allow-clear />
                <a-button
                  type="outline"
                  @click="handleCancel"
                  class="text-gray-500 border border-gray-300"
                  >取消</a-button
                >
                <a-button type="primary" @click="handleSavePassword">保存</a-button>
              </div>
              <div v-else class="flex items-center text-gray-500">
                已设置
                <img
                  src="@/assets/images/icon-edit.png"
                  class="h-4 ml-2 cursor-pointer"
                  @click="editActive = 'password'"
                />
              </div>
            </a-form-item>
            <a-form-item field="email" label="绑定邮箱">
              <div class="flex items-center text-gray-500">
                {{ formData.email }}
              </div>
            </a-form-item>
          </a-spin>
        </a-form>
      </div>
      <a-button
        type="text"
        size="mini"
        class="text-gray-600 rounded-full absolute right-3 top-4"
        @click="handleClose"
      >
        <template #icon>
          <icon-close />
        </template>
      </a-button>
    </div>
  </a-modal>
</template>

<style scoped>
:deep(.arco-form-item-label-col > .arco-form-item-label) {
  color: #000000 !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  letter-spacing: 0px !important;
}
</style>
