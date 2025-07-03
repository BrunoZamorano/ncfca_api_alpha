import { Module } from '@nestjs/common';
// todo: organize imports

import AuthController from '@/infraestructure/controllers/auth/auth.controller';
import ValidateToken from '@/application/use-cases/validate-token/validate-token';
import RefreshToken from '@/application/use-cases/refresh-token/refresh-token';
import { Login } from '@/application/use-cases/login/login';

import SharedModule from '@/shared/modules/shared-module';
import Logout from '@/application/use-cases/logout/logout';

@Module({
  imports: [SharedModule],
  providers: [Login, Logout, RefreshToken, ValidateToken],
  controllers: [AuthController],
})
export default class AuthModule {}
