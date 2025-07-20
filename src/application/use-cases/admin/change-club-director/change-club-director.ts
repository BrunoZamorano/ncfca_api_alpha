import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UserRoles } from '@/domain/enums/user-roles';

@Injectable()
export default class AdminChangeClubDirector {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}
  async execute(input: { clubId: string; newDirectorId: string }): Promise<void> {
    return this.uow.executeInTransaction(async () => {
      const club = await this.uow.clubRepository.find(input.clubId);
      if (!club) throw new EntityNotFoundException('Club', input.clubId);
      if (club.principalId === input.newDirectorId)
        throw new InvalidOperationException('New director is the same as the current director.');
      const newDirector = await this.uow.userRepository.find(input.newDirectorId);
      if (!newDirector) throw new EntityNotFoundException('User', input.newDirectorId);
      if (!newDirector.roles.includes(UserRoles.DONO_DE_CLUBE)) newDirector.assignRoles([UserRoles.DONO_DE_CLUBE]);
      const prevClub = await this.uow.clubRepository.findByPrincipalId(newDirector.id);
      if (prevClub) throw new InvalidOperationException('User can only own one club.');
      const prevDirector = await this.uow.userRepository.find(club.principalId);
      if (!prevDirector) throw new EntityNotFoundException('User', club.principalId);
      if (prevDirector.roles.includes(UserRoles.DONO_DE_CLUBE)) prevDirector.revokeRole(UserRoles.DONO_DE_CLUBE);
      club.changeOwner(input.newDirectorId);
      await this.uow.userRepository.save(newDirector);
      await this.uow.clubRepository.save(club);
    });
  }
}
