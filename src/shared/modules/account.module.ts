import { Module } from '@nestjs/common';

import RegisterUser from '@/application/use-cases/account/register-user/register-user';

import AccountController from '@/infraestructure/controllers/account/account.controller';

import SharedModule from '@/shared/modules/shared.module';
import EditUserProfile from '@/application/use-cases/account/edit-user-profile/edit-user-profile';
import ChangeUserPassword from '@/application/use-cases/account/change-user-password/change-user-password';

@Module({
  imports: [SharedModule],
  controllers: [AccountController],
  providers: [RegisterUser, EditUserProfile, ChangeUserPassword],
  exports: [],
})
export default class AccountModule {}
