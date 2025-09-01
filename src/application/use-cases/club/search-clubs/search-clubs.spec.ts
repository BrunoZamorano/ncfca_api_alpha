import { Test, TestingModule } from '@nestjs/testing';

import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';
import { AddressDto } from '@/domain/dtos/address.dto';
import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import ClubDto from '@/domain/dtos/club.dto';

import SearchClubs from '@/application/use-cases/club/search-clubs/search-clubs';

import { CLUB_QUERY } from '@/shared/constants/query-constants';

describe('SearchClubs', () => {
  let useCase: SearchClubs;

  const mockClub: ClubDto = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Mock Club',
    address: {} as AddressDto,
    principalId: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    createdAt: new Date(),
    corum: 10,
  };

  const mockClubQuery = {
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchClubs,
        {
          provide: CLUB_QUERY,
          useValue: mockClubQuery,
        },
      ],
    }).compile();

    useCase = module.get<SearchClubs>(SearchClubs);
  });

  it('should call the query and return paginated club data', async () => {
    const input: SearchClubsQueryDto = { pagination: { page: 1, limit: 100 } };
    const expectedOutput: PaginatedClubDto = {
      meta: {
        total: 250,
        page: 1,
        limit: 100,
        totalPages: 3,
      },
      data: Array.from({ length: 100 }, () => mockClub),
    };

    // Arrange
    mockClubQuery.search.mockResolvedValue(expectedOutput);

    // Act
    const output = await useCase.execute(input);

    // Assert
    expect(mockClubQuery.search).toHaveBeenCalledWith(input);
    expect(output).toEqual(expectedOutput);
    expect(output.meta.totalPages).toBe(3);
    expect(output.data.length).toBe(100);
    expect(output.meta.total).toBe(250);
  });
});
