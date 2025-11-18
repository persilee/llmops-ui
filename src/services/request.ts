import { BASE_URL, TIME_OUT } from '@/config'
import { Message } from '@arco-design/web-vue'
import { HttpCode } from './http-code'
import type { BaseResponse } from './types'

const baseFetchOptions = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include',
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  redirect: 'follow',
}

type FetchOptionType = Omit<RequestInit, 'body'> & {
  params?: Record<string, unknown>
  body?: BodyInit | Record<string, unknown> | null
}

const baseFetch = <T>(url: string, fetchOptions: FetchOptionType): Promise<BaseResponse<T>> => {
  const options: typeof baseFetchOptions & FetchOptionType = Object.assign(
    {},
    baseFetchOptions,
    fetchOptions,
  )

  let urlWithPrefix = `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`

  const { method, params, body } = options

  if (method === 'GET' && params) {
    const paramsString = Object.keys(params)
      .map((key) => {
        const value = params[key]
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return `${key}=${encodeURIComponent(value)}`
        }
        return ''
      })
      .filter((item) => item)
      .join('&')
    if (urlWithPrefix.includes('?')) {
      urlWithPrefix = `${urlWithPrefix}&${paramsString}`
    } else {
      urlWithPrefix = `${urlWithPrefix}?${paramsString}`
    }

    delete options.params
  }

  if (body && typeof body === 'object') {
    options.body = JSON.stringify(body)
  }

  return Promise.race([
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时'))
      }, TIME_OUT)
    }),

    new Promise((resolve, reject) => {
      globalThis
        .fetch(urlWithPrefix, options as RequestInit)
        .then(async (res) => {
          const data = await res.json()
          if (data.code === HttpCode.Success) {
            resolve(data)
          } else {
            Message.error(data.message)
            reject(new Error(data.message))
          }
        })
        .catch((err) => {
          Message.error(err?.message)
          reject(err)
        })
    }),
  ]) as Promise<BaseResponse<T>>
}

export const request = <T>(url: string, options = {}): Promise<BaseResponse<T>> => {
  return baseFetch<T>(url, options)
}

export const get = <T, P = any>({
  url,
  params,
}: {
  url: string
  params?: P
}): Promise<BaseResponse<T>> => {
  return request<T>(url, { method: 'GET', params: params })
}

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
export const ssePost = (
  url: string,
  fetchOptions: FetchOptionType,
  onData: (data: { [key: string]: any }) => void,
) => {
  // 合并基础请求配置、POST方法和自定义选项
  const options = Object.assign({}, baseFetchOptions, { method: 'POST' }, fetchOptions)
  // 处理URL，确保以BASE_URL为前缀
  const urlWithPrefix = `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`

  // 获取请求体
  const { body } = fetchOptions
  // 如果存在请求体，将其序列化为JSON字符串
  if (body) options.body = JSON.stringify(body)

  // 发起fetch请求并处理响应流
  globalThis.fetch(urlWithPrefix, options as RequestInit).then((response: Response) => {
    return handleStream(response, onData)
  })
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
