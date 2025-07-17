// src/infraestructure/dtos/refresh-token.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenInputDto {
  @ApiProperty({
    description: 'Refresh token válido obtido durante o login.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RefreshTokenOutputDto {
  @ApiProperty({ description: 'Novo token de acesso JWT.' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Novo token de atualização.' })
  @IsString()
  refreshToken: string;
}
