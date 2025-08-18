import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import ClubDto from '@/domain/dtos/club.dto';
import ClubMapper from '@/shared/mappers/club.mapper';

@Injectable()
export default class GetClubInfo {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: GetClubInfoInput): Promise<ClubDto> {
    return this.uow.executeInTransaction(async () => {
      const club = await this.uow.clubRepository.find(input.clubId);
      if (!club) throw new EntityNotFoundException('Club', input.clubId);
      return ClubMapper.entityToDto(club);
    });
  }
}

interface GetClubInfoInput {
  loggedInUserId: string;
  clubId: string;
}
