import { BASE_URL, TIME_OUT } from '@/config'
import router from '@/router'
import { useCredentialStore } from '@/stores/credential'
import { Message } from '@arco-design/web-vue'
import { HttpCode } from './http-code'
import type { BaseResponse } from './types'

/**
 * 基础请求配置选项
 * @description 定义了所有HTTP请求的默认配置
 */
const baseFetchOptions = {
  /** 请求方法，默认为GET */
  method: 'GET',
  /** 请求模式，设置为cors以支持跨域请求 */
  mode: 'cors',
  /** 是否发送凭证，设置为include以在跨域请求时发送cookies */
  credentials: 'include',
  /** 请求头配置，默认设置Content-Type为application/json */
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  /** 重定向模式，设置为follow自动跟随重定向 */
  redirect: 'follow',
}

/**
 * 请求选项类型定义
 *  @description 扩展了原生RequestInit，添加了自定义的params和body类型支持
 */
type FetchOptionType = Omit<RequestInit, 'body'> & {
  /** GET请求的查询参数对象 */
  params?: Record<string, unknown>
  /** 请求体数据，支持多种类型：BodyInit、普通对象或null */
  body?: BodyInit | Record<string, unknown> | null
}

/**
 * 基础请求函数，处理所有HTTP请求的核心逻辑
 * @param url 请求的URL路径
 * @param fetchOptions 请求配置选项，包含方法、参数、请求体等
 * @returns Promise<BaseResponse<T>> 返回一个Promise，包含服务器响应数据
 */
const baseFetch = <T>(url: string, fetchOptions: FetchOptionType): Promise<BaseResponse<T>> => {
  // 合并基础请求配置和用户自定义配置
  const options: typeof baseFetchOptions & FetchOptionType = Object.assign(
    {},
    baseFetchOptions,
    fetchOptions,
  )

  // 获取凭证存储实例
  const store = useCredentialStore()
  // 如果存在有效的访问令牌，则将其添加到请求头中
  if (store.credential && store.credential.access_token) {
    options.headers.set('Authorization', `Bearer ${store.credential.access_token}`)
  }

  // 构建完整的请求URL，确保以BASE_URL为前缀
  let urlWithPrefix = `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`

  // 解构请求配置中的方法、参数和请求体
  const { method, params, body } = options

  // 处理GET请求的查询参数
  if (method === 'GET' && params) {
    // 将参数对象转换为查询字符串
    const paramsString = Object.keys(params)
      .map((key) => {
        const value = params[key]
        // 只处理基本类型的参数值
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return `${key}=${encodeURIComponent(value)}`
        }
        return ''
      })
      .filter((item) => item)
      .join('&')
    // 根据URL是否已包含查询参数来决定使用'&'还是'?'
    if (urlWithPrefix.includes('?')) {
      urlWithPrefix = `${urlWithPrefix}&${paramsString}`
    } else {
      urlWithPrefix = `${urlWithPrefix}?${paramsString}`
    }

    // 从选项中删除params，避免将其作为请求体发送
    delete options.params
  }

  // 处理请求体，如果是对象则转换为JSON字符串
  if (body && typeof body === 'object') {
    options.body = JSON.stringify(body)
  }

  // 使用Promise.race实现请求超时控制
  return Promise.race([
    // 超时Promise，在指定时间后拒绝
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时'))
      }, TIME_OUT)
    }),

    // 实际请求Promise
    new Promise((resolve, reject) => {
      globalThis
        .fetch(urlWithPrefix, options as RequestInit)
        .then(async (res) => {
          const data = await res.json()
          // 处理成功响应
          if (data.code === HttpCode.Success) {
            resolve(data)
          }
          // 处理未授权响应，清除凭证并跳转到登录页
          else if (data.code === HttpCode.Unauthorized) {
            store.reset()
            Message.error('登录已过期，请重新登录')
            router.push({ name: 'auth-login' })
          }
          // 处理其他错误响应
          else {
            Message.error(data.message)
            reject(new Error(data.message))
          }
        })
        // 处理网络错误等异常
        .catch((err) => {
          Message.error(err?.message)
          reject(err)
        })
    }),
  ]) as Promise<BaseResponse<T>>
}

/**
 * 基础请求方法
 * @template T 响应数据的类型
 * @param {string} url 请求的URL路径
 * @param {FetchOptionType} options 请求配置选项，包含方法、参数、请求体等
 * @returns {Promise<BaseResponse<T>>} 返回一个Promise，包含服务器响应数据
 */
export const request = <T>(url: string, options = {}): Promise<BaseResponse<T>> => {
  return baseFetch<T>(url, options)
}

/**
 * GET请求方法
 * @template T 响应数据的类型
 * @template P 请求参数的类型
 * @param {Object} params 请求参数对象
 * @param {string} params.url 请求的URL路径
 * @param {P} [params.params] GET请求的查询参数
 * @returns {Promise<BaseResponse<T>>} 返回一个Promise，包含服务器响应数据
 */
export const get = <T, P = any>({
  url,
  params,
}: {
  url: string
  params?: P
}): Promise<BaseResponse<T>> => {
  return request<T>(url, { method: 'GET', params: params })
}

/**
 * POST请求方法
 * @template T 响应数据的类型
 * @template B 请求体的类型
 * @param {Object} params 请求参数对象
 * @param {string} params.url 请求的URL路径
 * @param {B} [params.body] POST请求的请求体数据
 * @returns {Promise<BaseResponse<T>>} 返回一个Promise，包含服务器响应数据
 */
export const post = <T, B = any>({
  url,
  body,
}: {
  url: string
  body?: B
}): Promise<BaseResponse<T>> => {
  return request<T>(url, { method: 'POST', body: body })
}

/**
 * 发送一个支持服务器发送事件(SSE)的POST请求
 * @param url 请求的URL路径
 * @param fetchOptions 请求配置选项，包含请求体等信息
 * @param onData 处理接收到的SSE数据的回调函数
 * @returns Promise<void>
 */
export const ssePost = async (
  url: string,
  fetchOptions: FetchOptionType,
  onData: (data: { [key: string]: any }) => void,
) => {
  // 合并基础请求配置、POST方法和自定义选项
  const options = Object.assign({}, baseFetchOptions, { method: 'POST' }, fetchOptions)
  // 设置Bearer认证头，用于服务器端验证用户身份
  const store = useCredentialStore()
  if (store.credential && store.credential.access_token) {
    options.headers.set('Authorization', `Bearer ${store.credential.access_token}`)
  }
  // 处理URL，确保以BASE_URL为前缀
  const urlWithPrefix = `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`

  // 获取请求体
  const { body } = fetchOptions
  // 如果存在请求体，将其序列化为JSON字符串
  if (body) options.body = JSON.stringify(body)

  // 发起fetch请求并处理响应流
  const resp = await globalThis.fetch(urlWithPrefix, options as RequestInit)

  return handleStream(resp, onData)
}

/**
 * 处理服务器发送事件(SSE)流的响应数据
 * @param response fetch API的响应对象，包含可读流
 * @param onData 处理解析后的事件数据的回调函数
 *               接收一个包含event和data字段的对象作为参数
 */
const handleStream = (response: Response, onData: (data: { [key: string]: any }) => void) => {
  // 检查响应状态，如果不成功则抛出错误
  if (!response.ok) throw new Error('网络请求失败')

  // 获取响应流的读取器，用于读取数据块
  const reader = response.body?.getReader()
  // 创建文本解码器，用于将二进制数据转换为文本
  const decoder = new TextDecoder('utf-8')
  // 缓冲区，用于存储未处理完的数据
  let buffer = ''

  /**
   * 递归读取并处理流数据
   * 持续读取数据块直到流结束或发生错误
   */
  const read = () => {
    let hasError = false
    // 读取下一个数据块
    reader?.read().then((result: any) => {
      // 如果流已结束，停止读取
      if (result.done) return

      // 将新数据块解码并添加到缓冲区
      buffer += decoder.decode(result.value, { stream: true })
      // 将缓冲区内容按行分割
      const lines = buffer.split('\n')

      // 用于存储当前处理的事件类型和数据
      let event = ''
      let data = ''

      try {
        // 遍历每一行数据
        lines.forEach((line) => {
          // 移除行首尾空白字符
          line = line.trim()
          // 处理事件类型行
          if (line.startsWith('event:')) {
            event = line.slice(6).trim()
          }
          // 处理数据行
          else if (line.startsWith('data:')) {
            data = line.slice(5).trim()
          }

          // 遇到空行表示一个完整的事件结束
          if (line == '') {
            // 如果事件类型和数据都存在，触发回调
            if (event != '' && data != '') {
              // 解析数据并调用回调函数
              onData({
                event,
                data: JSON.parse(data),
              })
              // 重置事件类型和数据
              event = ''
              data = ''
            }
          }
        })

        // 保留最后一行（可能是不完整的行）到缓冲区
        buffer = lines.pop() || ''
      } catch (error) {
        // 发生错误时标记错误状态
        hasError = true
      }

      // 如果没有发生错误，继续读取下一个数据块
      if (!hasError) read()
    })
  }

  // 开始读取流数据
  read()
}

/**
 * 文件上传函数
 * @param url 上传接口的URL路径
 * @param options 上传配置选项
 * @param options.method 请求方法，默认为POST
 * @param options.headers 请求头配置
 * @param options.data 上传的数据，通常是FormData对象
 * @param options.onProgress 上传进度回调函数
 * @returns Promise<T> 返回一个Promise，resolve时包含服务器响应数据
 */
export const upload = <T>(url: string, options: any) => {
  // 构建完整的请求URL，确保以BASE_URL为前缀
  const urlWithPrefix = `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`

  // 定义默认的上传配置
  const defaultOptions = {
    method: 'POST',
    url: urlWithPrefix,
    headers: {},
    data: {},
  }

  // 合并默认配置和用户自定义配置
  options = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  }

  // 获取凭证存储实例
  const store = useCredentialStore()
  // 如果存在有效的访问令牌，则将其添加到请求头中
  if (store.credential && store.credential.access_token) {
    // 设置Bearer认证头，用于服务器端验证用户身份
    options.headers['Authorization'] = `Bearer ${store.credential.access_token}`
  }

  // 返回Promise以支持异步操作
  return new Promise<BaseResponse<T>>((resolve, reject) => {
    // 创建XMLHttpRequest对象
    const xhr: XMLHttpRequest = new XMLHttpRequest()
    // 初始化请求
    xhr.open(options.method, options.url, true)
    // 设置请求头
    for (const key in options.headers) {
      xhr.setRequestHeader(key, options.headers[key])
    }

    // 允许发送凭证信息
    xhr.withCredentials = true
    // 设置响应类型为JSON
    xhr.responseType = 'json'

    // 监听请求状态变化
    xhr.onreadystatechange = () => {
      // 请求完成时处理响应
      if (xhr.readyState === 4) {
        // 请求成功时返回响应数据
        if (xhr.status === 200) {
          const resp = xhr.response
          if (resp.code == HttpCode.Success) {
            resolve(resp)
          } else if (resp.code == HttpCode.Unauthorized) {
            store.reset()
            Message.error('登录已过期，请重新登录')
          } else {
            reject(resp)
          }
        } else {
          // 请求失败时返回错误信息
          reject(xhr)
        }
      }
    }

    // 设置上传进度回调
    xhr.upload.onprogress = options.onProgress

    // 发送请求
    xhr.send(options.data)
  })
}
