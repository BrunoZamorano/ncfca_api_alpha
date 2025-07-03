import { Test, TestingModule } from '@nestjs/testing';

import SearchClubs from '@/application/use-cases/search-clubs/search-clubs';

import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';

import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
import AnemicTokenService from '@/infraestructure/services/anemic-token-service';
import ClubController from '@/infraestructure/controllers/club/club.controller';

import { CLUB_REPOSITORY } from '@/shared/constants/repository-constants';
import { TOKEN_SERVICE } from '@/shared/constants/service-constants';

describe('ClubController', () => {
  let clubController: ClubController;
  beforeEach(async function () {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ClubController],
      providers: [
        { provide: CLUB_REPOSITORY, useFactory: () => new ClubRepositoryMemory({ options: { totalClubs: 250 } }) },
        { provide: TOKEN_SERVICE, useClass: AnemicTokenService },
        SearchClubs,
      ],
    }).compile();
    clubController = app.get<ClubController>(ClubController);
  });

  it('Deve retornar todos os clubes até o limite máximo', async function () {
    const input: SearchClubsQueryDto = { pagination: { page: 1, limit: 100 } };
    const output = await clubController.searchClubs(input);
    expect(output.meta.totalPages).toBe(3);
    expect(output.data.length).toBe(input.pagination?.limit);
    expect(output.meta.limit).toBe(input.pagination?.limit);
    expect(output.meta.total).toBe(250);
    expect(output.meta.page).toBe(1);
  });
});
