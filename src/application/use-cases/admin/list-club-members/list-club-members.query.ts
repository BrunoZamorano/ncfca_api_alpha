export class ListClubMembersQuery {
  constructor(
    public readonly clubId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}