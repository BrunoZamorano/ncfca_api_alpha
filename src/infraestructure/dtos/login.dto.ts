// src/infraestructure/dtos/login.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginInputDto {
  @ApiProperty({
    description: 'Email do usuário para autenticação.',
    example: 'diretor.clube@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário.',
    example: 'Password@123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginOutputDto {
  @ApiProperty({ description: 'Token de acesso JWT, válido por 1 hora.' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ description: 'Token de atualização para obter um novo token de acesso, válido por 1 dia.' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
