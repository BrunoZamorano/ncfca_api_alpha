import { Module } from '@nestjs/common';

import ValidateToken from '@/application/use-cases/validate-token/validate-token';
import RefreshToken from '@/application/use-cases/refresh-token/refresh-token';
import Logout from '@/application/use-cases/logout/logout';
import Login from '@/application/use-cases/login/login';

import AuthController from '@/infraestructure/controllers/auth/auth.controller';

import SharedModule from '@/shared/modules/shared.module';

@Module({
  imports: [SharedModule],
  providers: [Login, Logout, RefreshToken, ValidateToken],
  controllers: [AuthController],
})
export default class AuthModule {}
