import { Inject, Injectable, ForbiddenException } from '@nestjs/common';

import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { AddressDto } from '@/domain/dtos/address.dto';
import Address from '@/domain/value-objects/address/address';

@Injectable()
export default class UpdateClubInfo {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: UpdateClubInfoInput): Promise<void> {
    return this.uow.executeInTransaction(async () => {
      const club = await this.uow.clubRepository.findByPrincipalId(input.principalId);
      if (!club) throw new EntityNotFoundException('Club', `for principalId: ${input.principalId}`);
      if (club.principalId !== input.principalId) throw new ForbiddenException('User is not authorized to edit this club.');
      club.updateInfo({ ...input, address: input.address ? new Address(input.address) : undefined });
      await this.uow.clubRepository.save(club);
    });
  }
}

interface UpdateClubInfoInput {
  principalId: string;
  maxMembers?: number;
  address?: AddressDto;
  name?: string;
}
