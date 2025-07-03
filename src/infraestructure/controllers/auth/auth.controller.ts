import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';

import { Login } from '@/application/use-cases/login/login';

import { LoginInputDto, LoginOutputDto } from '@/infraestructure/dtos/login.dto';
import RefreshToken from '@/application/use-cases/refresh-token/refresh-token';
import { RefreshTokenInputDto, RefreshTokenOutputDto } from '@/infraestructure/dtos/refresh-token.dto';
import ValidateToken from '@/application/use-cases/validate-token/validate-token';
import { ValidateTokenInputDto, ValidateTokenOutputDto } from '@/infraestructure/dtos/validate-token.dto';
import Logout from '@/application/use-cases/logout/logout';
import { LogoutInputDto } from '@/infraestructure/dtos/logout.dto';
import AuthGuard from '@/shared/guards/auth.guard';

@Controller('auth')
export default class AuthController {
  constructor(
    private readonly _validateToken: ValidateToken,
    private readonly _refreshToken: RefreshToken,
    private readonly _logout: Logout,
    private readonly _login: Login,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() input: LoginInputDto): Promise<LoginOutputDto> {
    return await this._login.execute(input);
  }

  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(@Body() input: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
    return await this._refreshToken.execute(input.token);
  }

  @Post('validate-token')
  @HttpCode(200)
  async validateToken(@Body() input: ValidateTokenInputDto): Promise<ValidateTokenOutputDto> {
    return await this._validateToken.execute(input.token);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(): Promise<void> {
    return this._logout.execute();
  }
}
