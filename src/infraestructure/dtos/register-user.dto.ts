// src/infraestructure/dtos/register-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from '@/domain/dtos/address.dto';
import { Match } from '@/shared/decorators/match.decorator';

export class RegisterUserInputDto {
  @ApiProperty({
    description: 'Primeiro nome do responsável familiar.',
    example: 'João',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  firstName: string;

  @ApiProperty({
    description: 'Último nome do responsável familiar.',
    example: 'Silva',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'O sobrenome deve ter no mínimo 2 caracteres.' })
  lastName: string;

  @ApiProperty({
    description: 'Email único para o cadastro.',
    example: 'joao.silva@example.com',
  })
  @IsEmail({}, { message: 'Por favor, insira um email válido.' })
  email: string;

  @ApiProperty({
    description: 'Telefone celular do responsável.',
    example: '11987654321',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'Insira um telefone válido.' })
  phone: string;

  @ApiProperty({
    description: 'CPF do responsável familiar.',
    example: '12345678900',
  })
  @IsString()
  @IsNotEmpty({ message: 'CPF é obrigatório.' })
  cpf: string;

  @ApiProperty({
    description: 'Senha de acesso.',
    example: 'Password@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  password: string;

  @ApiProperty({
    description: 'Confirmação da senha de acesso. Deve ser idêntica à senha.',
    example: 'Password@123',
  })
  @IsString()
  @Match('password', { message: 'As senhas não coincidem.' })
  confirmPassword: string;

  @ApiProperty({
    description: 'Endereço completo do responsável.',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

export class RegisterUserOutputDto {
  @ApiProperty({ description: 'Token de acesso JWT, válido por 15 minutos.' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ description: 'Token de atualização para obter um novo token de acesso, válido por 1 dia.' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
