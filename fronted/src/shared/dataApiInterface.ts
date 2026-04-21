export interface Data<T> {
  data: T[],
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DetailsError<T> = {
  [K in keyof T]?: string[];
}

export interface DataError<T> {
  type: string
  message: string
  details?: DetailsError<T>
}

