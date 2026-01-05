import { toJpeg as ElToJpg, toPng as ElToPng, toSvg as ElToSvg } from 'html-to-image'
import type { Options as HTMLToImageOptions } from 'html-to-image/es/types'
import type { Ref } from 'vue'
import { ref } from 'vue'
export type ImageType = 'jpeg' | 'png' | 'svg'

/**
 * 截图功能配置选项接口
 * @description 扩展自 html-to-image 的 Options 接口，添加了截图功能特有的配置选项
 */
export interface UseScreenshotOptions extends HTMLToImageOptions {
  /** 图片类型，可选 'jpeg' 或 'png'，默认为 'png' */
  type?: ImageType
  /** 下载文件名（不包含扩展名），默认使用时间戳生成 */
  fileName?: string
  /** 是否自动下载图片，默认为 false */
  shouldDownload?: boolean
  /** fetch 请求的初始化配置，用于加载跨域资源 */
  fetchRequestInit?: RequestInit
}

/**
 * 截图捕获函数类型
 * @param el - 需要捕获的 HTML 元素
 * @param options - 可选的截图配置选项
 * @returns 返回 Promise，解析为图片的 data URL 字符串
 * @description 定义了捕获 HTML 元素并转换为图片的函数类型，该函数接收一个 HTML 元素和可选的配置选项，
 *              返回一个 Promise，成功时解析为图片的 data URL 字符串
 */
export type CaptureScreenshot = (el: HTMLElement, options?: UseScreenshotOptions) => Promise<string>

/**
 * 下载函数类型
 * @param fileName - 要下载的文件名（不包含扩展名）
 * @returns 无返回值
 * @description 定义了下载截图文件的函数类型，该函数接收文件名作为参数，
 *              会根据当前图片类型自动添加相应的扩展名（.jpeg 或 .png）
 */
export type Download = (fileName: string) => void

/**
 * 截图功能接口
 * @description 定义了截图功能 Hook 返回的对象结构，包含捕获、下载、数据存储和错误处理等功能
 */
export interface UseScreenshot {
  /** 捕获 HTML 元素并转换为图片的方法 */
  capture: CaptureScreenshot
  /** 下载截图文件的方法 */
  download: Download
  /** 存储图片 data URL 的响应式引用 */
  dataUrl: Ref<string>
  /** 存储错误信息的响应式引用 */
  error: Ref
}

/**
 * 截图功能 Hook
 * @returns 返回一个包含截图相关功能的对象
 * @returns {CaptureScreenshot} capture - 捕获 HTML 元素并转换为图片的方法
 * @returns {Download} download - 下载截图文件的方法
 * @returns {Ref<string>} dataUrl - 存储图片 data URL 的响应式引用
 * @returns {Ref} error - 存储错误信息的响应式引用
 * @description 提供截图功能，包括捕获 HTML 元素、转换为图片、下载图片等功能。
 *              支持将元素转换为 JPEG 或 PNG 格式的图片，并提供了自动下载的能力。
 *              使用 html-to-image 库实现截图功能。
 */
export function useScreenshot(): UseScreenshot {
  const dataUrl = ref<string>('')
  const imgType = ref<ImageType>('png')
  const error = ref()

  /**
   * 捕获 HTML 元素并转换为图片
   * @param el - 需要捕获的 HTML 元素
   * @param options - 捕获选项配置
   * @param options.type - 图片类型，可选 'jpeg' 或 'png'，默认为 'png'
   * @param options.fileName - 下载文件名（不包含扩展名），默认使用时间戳生成
   * @param options.shouldDownload - 是否自动下载图片，默认为 false
   * @param options.fetchRequestInit - fetch 请求的初始化配置
   * @returns 返回 Promise，解析为图片的 data URL 字符串
   * @description 根据指定的图片类型（jpeg/png）捕获元素并转换为图片，
   *              转换成功后会更新 dataUrl 状态，
   *              如果 shouldDownload 为 true 且文件名不为空，会自动触发下载
   */
  async function capture(el: HTMLElement, options: UseScreenshotOptions = {}) {
    let data

    const fileName = options.fileName ?? `vue-flow-screenshot-${Date.now()}`

    switch (options.type) {
      case 'jpeg':
        data = await toJpeg(el, options)
        break
      case 'png':
        data = await toPng(el, options)
        break
      case 'svg':
        data = await toSvg(el, options)
        break
      default:
        data = await toPng(el, options)
        break
    }

    if (options.shouldDownload && fileName !== '') {
      download(fileName)
    }

    return data
  }

  /**
   * 将 HTML 元素转换为 JPEG 图片
   * @param el - 需要转换的 HTML 元素
   * @param options - 转换选项配置，默认质量为 0.95
   * @returns 返回 Promise，解析为图片的 data URL 字符串
   * @description 使用 html-to-image 库将指定元素转换为 JPEG 格式的图片，
   *              转换成功后会更新 dataUrl 和 imgType 状态，
   *              失败时会设置 error 状态并抛出错误
   */
  function toJpeg(el: HTMLElement, options: HTMLToImageOptions = { quality: 0.95 }) {
    error.value = null

    return ElToJpg(el, options)
      .then((data) => {
        dataUrl.value = data
        imgType.value = 'jpeg'
        return data
      })
      .catch((error) => {
        error.value = error
        throw new Error(error)
      })
  }

  /**
   * 将 HTML 元素转换为 PNG 图片
   * @param el - 需要转换的 HTML 元素
   * @param options - 转换选项配置，默认质量为 0.95
   * @returns 返回 Promise，解析为图片的 data URL 字符串
   * @description 使用 html-to-image 库将指定元素转换为 PNG 格式的图片，
   *              转换成功后会更新 dataUrl 和 imgType 状态，
   *              失败时会设置 error 状态并抛出错误
   */
  function toPng(el: HTMLElement, options: HTMLToImageOptions = { quality: 0.95 }) {
    error.value = null

    return ElToPng(el, options)
      .then((data) => {
        dataUrl.value = data
        imgType.value = 'png'
        return data
      })
      .catch((error) => {
        error.value = error
        throw new Error(error)
      })
  }

  /**
   * 将 HTML 元素转换为 SVG 图片
   * @param el - 需要转换的 HTML 元素
   * @param options - 转换选项配置，默认质量为 0.95
   * @returns 返回 Promise，解析为图片的 data URL 字符串
   * @description 使用 html2canvas 库将指定元素转换为 SVG 格式的图片，
   *              转换过程分为两步：1. 将HTML转换为Canvas 2. 将Canvas转换为SVG
   *              转换成功后会更新 dataUrl 和 imgType 状态，
   *              失败时会设置 error 状态并抛出错误
   */
  const toSvg = async (el: HTMLElement, options: HTMLToImageOptions = { quality: 0.95 }) => {
    error.value = null

    return ElToSvg(el, options)
      .then((data) => {
        dataUrl.value = data
        imgType.value = 'svg'
        return data
      })
      .catch((error) => {
        error.value = error
        throw new Error(error)
      })
  }

  /**
   * 下载截图文件
   * @param fileName - 下载文件的名称（不包含扩展名）
   * @description 创建一个临时的<a>元素，设置下载属性和图片数据URL，然后触发点击来下载图片
   *              文件扩展名会根据当前图片类型（jpeg/png）自动添加
   */
  function download(fileName: string) {
    const link = document.createElement('a')
    link.download = `${fileName}.${imgType.value}`
    link.href = dataUrl.value
    link.click()
  }

  return {
    capture,
    download,
    dataUrl,
    error,
  }
}
