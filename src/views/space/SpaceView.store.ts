import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// 定义模态框类型
type ModalType = 'app' | 'tool' | 'dataset' | 'workflow'
type ModalMode = 'create' | 'edit'

interface ModalState {
  mode: ModalMode | null
  isOpen: boolean
}

export const useSpaceStore = defineStore(
  'space',
  () => {
    // 搜索关键词
    const searchWord = ref<string>('')

    // 模态框状态管理 - 使用对象分组相关状态
    const modals = ref<Record<ModalType, ModalState>>({
      app: { mode: null, isOpen: false },
      tool: { mode: null, isOpen: false },
      dataset: { mode: null, isOpen: false },
      workflow: { mode: null, isOpen: false },
    })

    // 打开模态框 - 通用方法
    const openModal = (type: ModalType, mode: ModalMode) => {
      modals.value[type] = { mode, isOpen: true }

      // 关闭其他类型的模态框
      Object.keys(modals.value).forEach((key) => {
        if (key !== type) {
          modals.value[key as ModalType].isOpen = false
        }
      })
    }

    // 关闭模态框 - 通用方法
    const closeModal = (type: ModalType) => {
      modals.value[type].isOpen = false
      modals.value[type].mode = null
    }

    // 关闭所有模态框
    const closeAllModals = () => {
      Object.keys(modals.value).forEach((key) => {
        modals.value[key as ModalType] = { mode: null, isOpen: false }
      })
    }

    // 计算属性 - 获取模态框状态
    const getModalState = (type: ModalType) =>
      computed(() => ({
        isOpen: modals.value[type].isOpen,
        isCreateMode: modals.value[type].mode === 'create',
        isEditMode: modals.value[type].mode === 'edit',
      }))

    // 快捷访问方法 - 应用模态框
    const openCreateAppModal = () => openModal('app', 'create')
    const openEditAppModal = () => openModal('app', 'edit')
    const appModal = getModalState('app')

    // 快捷访问方法 - 工具模态框
    const openCreateToolModal = () => openModal('tool', 'create')
    const openEditToolModal = () => openModal('tool', 'edit')
    const toolModal = getModalState('tool')

    // 快捷访问方法 - 数据集模态框
    const openCreateDatasetModal = () => openModal('dataset', 'create')
    const openEditDatasetModal = () => openModal('dataset', 'edit')
    const datasetModal = getModalState('dataset')

    // 快捷访问方法 - 工作流模态框
    const openCreateWorkflowModal = () => openModal('workflow', 'create')
    const openEditWorkflowModal = () => openModal('workflow', 'edit')
    const workflowModal = getModalState('workflow')

    // 重置状态
    const $reset = () => {
      searchWord.value = ''
      closeAllModals()
    }

    return {
      // 搜索功能
      searchWord,

      // 通用模态框方法
      openModal,
      closeModal,
      closeAllModals,

      // 应用模态框
      openCreateAppModal,
      openEditAppModal,
      appModal,

      // 工具模态框
      openCreateToolModal,
      openEditToolModal,
      toolModal,

      // 数据集模态框
      openCreateDatasetModal,
      openEditDatasetModal,
      datasetModal,
      // 工作流模态框
      openCreateWorkflowModal,
      openEditWorkflowModal,
      workflowModal,

      getModalState,

      // 重置方法
      $reset,
    }
  },
  {
    persist: true,
  },
)

// 类型导出 - 方便在组件中使用
export type SpaceStore = ReturnType<typeof useSpaceStore>
export type ModalStateResult = ReturnType<ReturnType<typeof useSpaceStore>['getModalState']>
