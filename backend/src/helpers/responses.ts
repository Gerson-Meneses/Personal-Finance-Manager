export const ok = <T>(data: T) => ({
  data
})

export const paginated = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) => ({
  data: items,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
})