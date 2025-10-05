import { BASE_URL, TIME_OUT } from '@/config'

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

const baseFetch = <T>(url: string, fetchOptions: FetchOptionType): Promise<T> => {
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
        .then((res) => {
          if (res.status === 200) {
            return res.json()
          } else {
            throw new Error(res.statusText)
          }
        })
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    }),
  ]) as Promise<T>
}

export const request = <T>(url: string, options = {}) => {
  return baseFetch<T>(url, options)
}

export const get = <T>(url: string, params = {}) => {
  return request<T>(url, { method: 'GET', params })
}

export const post = <T>(url: string, body = {}) => {
  return request<T>(url, { method: 'POST', body })
}
