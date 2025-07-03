import { Module } from '@nestjs/common';

import RegisterUser from '@/application/use-cases/register-user/register-user';

import AccountController from '@/infraestructure/controllers/account/account.controller';

import SharedModule from '@/shared/modules/shared-module';

@Module({
  imports: [SharedModule],
  controllers: [AccountController],
  providers: [RegisterUser],
  exports: [],
})
export default class AccountModule {}
