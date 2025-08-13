import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UserRoles } from '@/domain/enums/user-roles';

@Injectable()
export default class AdminChangeClubPrincipal {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}
  async execute(input: { clubId: string; newPrincipalId: string }): Promise<void> {
    return this.uow.executeInTransaction(async () => {
      const club = await this.uow.clubRepository.find(input.clubId);
      if (!club) throw new EntityNotFoundException('Club', input.clubId);
      if (club.principalId === input.newPrincipalId)
        throw new InvalidOperationException('New principal is the same as the current principal.');
      const newPrincipal = await this.uow.userRepository.find(input.newPrincipalId);
      if (!newPrincipal) throw new EntityNotFoundException('User', input.newPrincipalId);
      if (!newPrincipal.roles.includes(UserRoles.DONO_DE_CLUBE)) newPrincipal.assignRoles([UserRoles.DONO_DE_CLUBE]);
      const prevClub = await this.uow.clubRepository.findByPrincipalId(newPrincipal.id);
      if (prevClub) throw new InvalidOperationException('User can only own one club.');
      const prevPrincipal = await this.uow.userRepository.find(club.principalId);
      if (!prevPrincipal) throw new EntityNotFoundException('User', club.principalId);
      if (prevPrincipal.roles.includes(UserRoles.DONO_DE_CLUBE)) prevPrincipal.revokeRole(UserRoles.DONO_DE_CLUBE);
      club.changeOwner(input.newPrincipalId);
      await this.uow.userRepository.save(newPrincipal);
      await this.uow.clubRepository.save(club);
    });
  }
}
