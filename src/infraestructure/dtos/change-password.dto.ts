// src/infraestructure/dtos/change-password.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha antiga do usuário.',
    example: 'OldPassword@123',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'Nova senha. Deve conter pelo menos uma letra maiúscula, uma minúscula, um número e ter no mínimo 8 caracteres.',
    example: 'NewStrongPassword@456',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long.',
  })
  newPassword: string;
}
