// src/infraestructure/dtos/validate-token.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ValidateTokenInputDto {
  @ApiProperty({
    description: 'Access token a ser validado.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ValidateTokenOutputDto {
  @ApiProperty({ description: 'ID da família associada ao token.' })
  @IsString()
  familyId: string;

  @ApiProperty({ description: 'Perfis (roles) do usuário contidos no token.' })
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({ description: 'Email do usuário.' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'ID do usuário (subject).' })
  @IsString()
  sub: string;

  @ApiProperty({ description: 'Timestamp de emissão do token (Issued At).', type: 'integer' })
  @IsNumber()
  iat: number;

  @ApiProperty({ description: 'Timestamp de expiração do token (Expiration Time).', type: 'integer' })
  @IsNumber()
  exp: number;
}
