export interface ApiSuccess<T> {
  data: T
}

export interface ApiPaginated<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiError {
  error: {
    message: string
    code: string
    details?: unknown
  }
}