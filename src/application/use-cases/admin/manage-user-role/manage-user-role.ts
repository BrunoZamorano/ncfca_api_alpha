import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { UserRoles } from '@/domain/enums/user-roles';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

@Injectable()
export default class AdminManageUserRole {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}
  async execute(input: { userId: string; roles: UserRoles[] }): Promise<void> {
    return this.uow.executeInTransaction(async () => {
      const user = await this.uow.userRepository.find(input.userId);
      if (!user) throw new EntityNotFoundException('User', input.userId);
      user.roles.length = 0;
      user.addRoles(input.roles);
      await this.uow.userRepository.save(user);
    });
  }
}
