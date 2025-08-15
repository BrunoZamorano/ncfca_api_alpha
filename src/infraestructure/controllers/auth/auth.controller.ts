import { Body, Controller, HttpCode, Post, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import ValidateToken from '@/application/use-cases/auth/validate-token/validate-token.use-case';
import RefreshToken from '@/application/use-cases/auth/refresh-token/refresh-token.use-case';
import Logout from '@/application/use-cases/auth/logout/logout.use-case';
import Login from '@/application/use-cases/auth/login/login.use-case';

import { LoginInputDto, LoginOutputDto } from '@/infraestructure/dtos/login.dto';
import { RefreshTokenInputDto, RefreshTokenOutputDto } from '@/infraestructure/dtos/refresh-token.dto';
import { ValidateTokenInputDto, ValidateTokenOutputDto } from '@/infraestructure/dtos/validate-token.dto';

import AuthGuard from '@/shared/guards/auth.guard';

@ApiTags('Autenticação')
@Controller('auth')
export default class AuthController {
  constructor(
    private readonly _validateToken: ValidateToken,
    private readonly _refreshToken: RefreshToken,
    private readonly _logout: Logout,
    private readonly _login: Login,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Realiza a autenticação do usuário',
    description: 'Autentica um usuário com email e senha, retornando tokens de acesso e de atualização em caso de sucesso.',
  })
  @ApiResponse({ status: 200, description: 'Autenticação bem-sucedida, retorna tokens.', type: LoginOutputDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() input: LoginInputDto): Promise<LoginOutputDto> {
    return await this._login.execute(input);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gera um novo par de tokens',
    description: 'Gera um novo par de tokens (acesso e atualização) a partir de um refresh token válido.',
  })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso.', type: RefreshTokenOutputDto })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado.' })
  async refreshToken(@Body() input: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
    return await this._refreshToken.execute(input.token);
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valida um access token',
    description: 'Verifica a validade de um access token e retorna seu payload decodificado se for válido.',
  })
  @ApiResponse({ status: 200, description: 'Token válido.', type: ValidateTokenOutputDto })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  async validateToken(@Body() input: ValidateTokenInputDto): Promise<ValidateTokenOutputDto> {
    return await this._validateToken.execute(input.token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Realiza o logout do usuário',
    description: 'Endpoint para invalidar o token do lado do cliente. O servidor não mantém estado (no-op).',
  })
  @ApiResponse({ status: 204, description: 'Logout processado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado (token inválido ou ausente).' })
  async logout(): Promise<void> {
    return this._logout.execute();
  }
}
