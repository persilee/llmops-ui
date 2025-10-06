export type BaseResponse<T> = {
  code: string
  message: string
  data: T
}

export type BasePaginatorResponse<T> = BaseResponse<{
  list: Array<T>
  paginator: {
    totalPage: number
    totalRecord: number
    currentPage: number
    pageSize: number
  }
}>
