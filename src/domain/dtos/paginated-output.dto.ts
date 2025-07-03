export default class PaginatedOutputDto<T> {
  data:T[];
  meta: {
    totalPages: number,
    total: number,
    limit: number
    page: number,
  };
}