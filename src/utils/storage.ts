import { is, isNull } from 'ts-type-guards'

/**
 * 存储操作的状态枚举
 */
export const enum Status {
  OK = 'OK',              // 操作成功
  ABSENT = 'ABSENT',      // 值不存在
  TYPE_ERROR = 'TYPE_ERROR',      // 类型错误
  JSON_ERROR = 'JSON_ERROR',      // JSON解析错误
  STORAGE_ERROR = 'STORAGE_ERROR', // 存储访问错误
  NUMBER_ERROR = 'NUMBER_ERROR',   // 数字值错误（NaN、Infinity等）
}

/**
 * 统一的响应接口
 * @template T 响应值的类型
 */
export interface Response<T> {
  status: Status    // 操作状态
  value: T         // 返回值
}

/** 获取localStorage实例 */
const LOCAL_STORAGE = () => localStorage
/** 获取sessionStorage实例 */
const SESSION_STORAGE = () => sessionStorage

/** 基础数据类型定义 */
type BasicTypes = boolean | number | string

/**
 * 字典类型定义
 * @template K 键的类型
 * @template T 值的类型
 */
export type Dictionary<K extends string, T extends { [key in K]: AllowedTypes }> = T

/** 数组类型定义 */
type ArrayType = ReadonlyArray<AllowedTypes>

/** 允许存储的数据类型 */
export type AllowedTypes = BasicTypes | ArrayType | any

/**
 * 从localStorage获取值
 * @template T 值的类型
 * @param key 存储键
 * @param fallback 默认值
 * @returns 包含状态和值的响应对象
 */
export function get<T extends AllowedTypes>(key: string, fallback: T): Response<T> {
  return getFrom(LOCAL_STORAGE, key, fallback)
}

/**
 * 从sessionStorage获取值
 * @template T 值的类型
 * @param key 存储键
 * @param fallback 默认值
 * @returns 包含状态和值的响应对象
 */
export function get_session<T extends AllowedTypes>(key: string, fallback: T): Response<T> {
  return getFrom(SESSION_STORAGE, key, fallback)
}

/**
 * 向localStorage存储值
 * @template T 值的类型
 * @param key 存储键
 * @param value 要存储的值
 * @returns 包含状态和值的响应对象
 */
export function set<T extends AllowedTypes>(key: string, value: T): Response<T> {
  return setIn(LOCAL_STORAGE, key, value)
}

/**
 * 向sessionStorage存储值
 * @template T 值的类型
 * @param key 存储键
 * @param value 要存储的值
 * @returns 包含状态和值的响应对象
 */
export function set_session<T extends AllowedTypes>(key: string, value: T): Response<T> {
  return setIn(SESSION_STORAGE, key, value)
}

/**
 * 从localStorage删除值
 * @param key 存储键
 * @returns 包含状态和布尔值的响应对象
 */
export function remove(key: string): Response<boolean> {
  return removeIn(LOCAL_STORAGE, key)
}

/**
 * 从sessionStorage删除值
 * @param key 存储键
 * @returns 包含状态和布尔值的响应对象
 */
export function remove_session(key: string): Response<boolean> {
  return removeIn(SESSION_STORAGE, key)
}

/**
 * 清除localStorage中的所有值
 * @returns 包含状态和布尔值的响应对象
 */
export function clear(): Response<boolean> {
  return clearIn(LOCAL_STORAGE)
}

/**
 * 清除sessionStorage中的所有值
 * @returns 包含状态和布尔值的响应对象
 */
export function clear_session(): Response<boolean> {
  return clearIn(SESSION_STORAGE)
}

/**
 * 从指定存储中获取值的内部实现
 * @template T 值的类型
 * @param storage 存储对象获取函数
 * @param key 存储键
 * @param fallback 默认值
 * @returns 包含状态和值的响应对象
 */
function getFrom<T extends AllowedTypes>(
  storage: () => Storage,
  key: string,
  fallback: T,
): Response<T> {
  try {
    const savedValue: T | null = readFrom(storage(), key, fallback)

    if (isNull(savedValue)) {
      // 没有找到存储的值
      return {
        status: Status.ABSENT,
        value: fallback,
      }
    } else {
      // 找到有效的存储值
      return {
        status: Status.OK,
        value: savedValue,
      }
    }
  } catch (err) {
    const status =
      // JSON解析错误
      is(SyntaxError)(err)
        ? Status.JSON_ERROR
        : // 类型错误
          is(TypeError)(err)
          ? Status.TYPE_ERROR
          : // 存储访问错误
            Status.STORAGE_ERROR
    return {
      status,
      value: fallback,
    }
  }
}

/**
 * 向指定存储中设置值的内部实现
 * @template T 值的类型
 * @param storage 存储对象获取函数
 * @param key 存储键
 * @param value 要存储的值
 * @returns 包含状态和值的响应对象
 */
function setIn<T extends AllowedTypes>(storage: () => Storage, key: string, value: T): Response<T> {
  try {
    saveIn(storage(), key, value)
    return {
      status: Status.OK,
      value,
    }
  } catch (err) {
    const status =
      // 数字值错误（NaN、Infinity等）
      is(RangeError)(err)
        ? Status.NUMBER_ERROR
        : // JSON序列化错误
          is(SyntaxError)(err) || is(TypeError)(err)
          ? Status.JSON_ERROR
          : // 存储访问错误
            Status.STORAGE_ERROR
    return {
      status,
      value,
    }
  }
}

/**
 * 从指定存储中删除值的内部实现
 * @param storage 存储对象获取函数
 * @param key 存储键
 * @returns 包含状态和布尔值的响应对象
 */
function removeIn(storage: () => Storage, key: string): Response<boolean> {
  try {
    storage().removeItem(key)
    return {
      status: Status.OK,
      value: true,
    }
  } catch {
    return {
      status: Status.STORAGE_ERROR,
      value: false,
    }
  }
}

/**
 * 清除指定存储中所有值的内部实现
 * @param storage 存储对象获取函数
 * @returns 包含状态和布尔值的响应对象
 */
function clearIn(storage: () => Storage): Response<boolean> {
  try {
    storage().clear()
    return {
      status: Status.OK,
      value: true,
    }
  } catch {
    return {
      status: Status.STORAGE_ERROR,
      value: false,
    }
  }
}

/**
 * 从存储中读取值的底层实现
 * @template T 值的类型
 * @param storage 存储对象
 * @param key 存储键
 * @param reference 类型参考值
 * @returns 解析后的值或null
 */
function readFrom<T extends AllowedTypes>(storage: Storage, key: string, reference: T): T | null {
  if (storage === null) {
    // 存储对象无效
    throw new DOMException()
  }
  // 获取存储的值，可能抛出DOMException
  const readValue: string | null = storage.getItem(key)
  if (isNull(readValue)) {
    return null
  }
  // 解析JSON值，可能抛出SyntaxError
  const parsedValue: any = JSON.parse(readValue)
  return parsedValue
}

/**
 * 向存储中保存值的底层实现
 * @template T 值的类型
 * @param storage 存储对象
 * @param key 存储键
 * @param value 要存储的值
 */
function saveIn<T extends AllowedTypes>(storage: Storage, key: string, value: T): void {
  // JSON序列化时的替换函数，用于处理特殊数字值
  const replacer = (_key: string, v: any) => {
    if (typeof v === 'number' && !Number.isFinite(v)) {
      // 遇到NaN、Infinity或-Infinity时抛出错误
      throw new RangeError(v.toString())
    }
    return v
  }
  // 序列化值，可能抛出TypeError、RangeError等
  const stringifiedValue: string = JSON.stringify(value, replacer)
  if (storage === null) {
    // 存储对象无效
    throw new DOMException()
  }
  // 保存值，可能抛出DOMException
  storage.setItem(key, stringifiedValue)
}

