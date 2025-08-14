import { Inject, Injectable } from '@nestjs/common';

import { USER_QUERY, UserQuery } from '@/application/queries/user-query/user-query.interface';
import SearchUsersQueryDto from '@/domain/dtos/search-users-query.dto';
import { PaginatedUserDto } from '@/domain/dtos/paginated-output.dto';

@Injectable()
export class SearchUsers {
  constructor(
    @Inject(USER_QUERY)
    private readonly _userQuery: UserQuery,
  ) {}

  async execute(query: SearchUsersQueryDto): Promise<PaginatedUserDto> {
    return this._userQuery.search(query);
  }
}
