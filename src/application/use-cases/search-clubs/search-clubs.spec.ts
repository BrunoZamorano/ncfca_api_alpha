import SearchClubs from '@/application/use-cases/search-clubs/search-clubs';

import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';

import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';

describe('Search Clubs', function () {
  it('Deve retornar todos os clubes até o limite máximo', async function () {
    const input: SearchClubsQueryDto = { pagination: { page: 1, limit: 100 } };
    const useCase = new SearchClubs(new ClubRepositoryMemory({ options: { totalClubs: 250 } }));
    const output = await useCase.execute(input);
    expect(output.meta.totalPages).toBe(3);
    expect(output.data.length).toBe(input.pagination?.limit);
    expect(output.meta.limit).toBe(input.pagination?.limit);
    expect(output.meta.total).toBe(250);
    expect(output.meta.page).toBe(1);
  });
});
