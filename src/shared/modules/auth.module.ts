import { Module } from '@nestjs/common';

import ValidateToken from '@/application/use-cases/auth/validate-token/validate-token.use-case';
import RefreshToken from '@/application/use-cases/auth/refresh-token/refresh-token.use-case';
import Logout from '@/application/use-cases/auth/logout/logout.use-case';
import Login from '@/application/use-cases/auth/login/login.use-case';

import AuthController from '@/infraestructure/controllers/auth/auth.controller';

import SharedModule from '@/shared/modules/shared.module';

@Module({
  imports: [SharedModule],
  providers: [Login, Logout, RefreshToken, ValidateToken],
  controllers: [AuthController],
})
export default class AuthModule {}
