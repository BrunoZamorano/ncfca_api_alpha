import { Inject, Injectable } from '@nestjs/common';
import { QUERY_SERVICE, QueryService } from '@/application/services/query.service';
import { ClubMemberDto } from '@/application/queries/club-query/club.query';
import { ListClubMembersQuery } from './list-club-members.query';

@Injectable()
export default class AdminListClubMembersUseCase {
  constructor(@Inject(QUERY_SERVICE) private readonly queryService: QueryService) {}

  async execute(query: ListClubMembersQuery): Promise<{
    members: ClubMemberDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const allMembers = await this.queryService.clubQuery.getClubMembersListView(query.clubId);
    const offset = (query.page - 1) * query.limit;
    const paginatedMembers = allMembers.slice(offset, offset + query.limit);

    return {
      members: paginatedMembers,
      total: allMembers.length,
      page: query.page,
      limit: query.limit,
    };
  }
}
