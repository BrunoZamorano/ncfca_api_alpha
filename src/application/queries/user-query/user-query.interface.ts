import SearchUsersQueryDto from '@/domain/dtos/search-users-query.dto';
import { PaginatedUserDto } from '@/domain/dtos/paginated-output.dto';

export const USER_QUERY = 'USER_QUERY';

export interface UserQuery {
  search(query: SearchUsersQueryDto): Promise<PaginatedUserDto>;
}
