import { BASE_URL, TIME_OUT } from '@/config'
import router from '@/router'
import { useCredentialStore } from '@/stores/credential'
import { Message } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
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

  // 检查请求头是否为空且存在有效的访问令牌
  const token = store.credential?.access_token
  if (token && options.headers instanceof Headers && !options.headers.get('Authorization')) {
    options.headers.set('Authorization', `Bearer ${token}`)
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
            useRouter().push({ name: 'auth-login' })
          } else if (data.code === HttpCode.NotFound) {
            console.log('aaaaaaaaccccccccc', data)

            await router.push({ name: 'errors-not-found', query: data.data })
          } else if (data.code === HttpCode.Forbidden) {
            await router.push({ name: 'errors-forbidden' })
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
  const token = store.credential?.access_token
  if (token && options.headers instanceof Headers && !options.headers.get('Authorization')) {
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

  const contentType = resp.headers.get('Content-Type')
  if (contentType?.includes('application/json')) {
    return await resp.json()
  }

  return await handleStream(resp, onData)
}

/**
 * 处理服务器发送事件(SSE)流的响应数据
 * @param response fetch API的响应对象，包含可读流
 * @param onData 处理解析后的事件数据的回调函数
 *               接收一个包含event和data字段的对象作为参数
 */
const handleStream = (
  response: Response,
  onData: (data: Record<string, any>) => void,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // 检查响应状态
    if (!response.ok) {
      reject(new Error(`网络请求失败: ${response.status} ${response.statusText}`))
      return
    }

    // 获取响应流读取器
    const reader = response.body?.getReader()
    if (!reader) {
      reject(new Error('无法获取响应流读取器'))
      return
    }

    // 创建文本解码器
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let isReading = true

    // 清理函数
    const cleanup = () => {
      isReading = false
      reader.releaseLock()
    }

    // 处理单行数据
    const processLine = (line: string, eventData: { event: string; data: string }) => {
      const trimmedLine = line.trim()

      if (trimmedLine.startsWith('event:')) {
        eventData.event = trimmedLine.slice(6).trim()
      } else if (trimmedLine.startsWith('data:')) {
        eventData.data = trimmedLine.slice(5).trim()
      } else if (trimmedLine === '') {
        if (eventData.event && eventData.data) {
          try {
            onData({
              event: eventData.event,
              data: JSON.parse(eventData.data),
            })
          } catch (error) {
            console.error('解析SSE数据失败:', error)
          }
          eventData.event = ''
          eventData.data = ''
        }
      }
    }

    // 读取流数据
    const readStream = async () => {
      try {
        while (isReading) {
          const { done, value } = await reader.read()

          if (done) {
            resolve()
            return
          }

          // 解码并处理数据
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留最后一行（可能是不完整的行）

          const eventData = { event: '', data: '' }
          lines.forEach((line) => processLine(line, eventData))
        }
      } catch (error) {
        cleanup()
        reject(error instanceof Error ? error : new Error('流读取失败'))
      }
    }

    // 开始读取
    readStream()

    // 返回清理函数
    return cleanup
  })
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
