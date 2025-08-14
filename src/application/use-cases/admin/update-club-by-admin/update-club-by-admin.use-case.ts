import { Inject, Injectable } from '@nestjs/common';

import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import Address from '@/domain/value-objects/address/address';
import { UpdateClubByAdminInput } from './update-club-by-admin.input';
import Club from '@/domain/entities/club/club';

@Injectable()
export default class UpdateClubByAdmin {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: UpdateClubByAdminInput): Promise<Club> {
    return this.uow.executeInTransaction(async () => {
      const club = await this.uow.clubRepository.find(input.clubId);
      if (!club) {
        throw new EntityNotFoundException('Club', `for clubId: ${input.clubId}`);
      }

      club.updateInfo({
        ...input.data,
        address: input.data.address ? new Address(input.data.address) : undefined,
      });

      return await this.uow.clubRepository.save(club);
    });
  }
}
