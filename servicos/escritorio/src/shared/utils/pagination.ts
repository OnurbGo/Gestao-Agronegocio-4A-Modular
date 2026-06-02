export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export function getPagination(query: PaginationQuery) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function toPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

