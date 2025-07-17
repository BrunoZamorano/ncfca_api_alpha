// src/infraestructure/dtos/address.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class AddressDto {
  @ApiProperty({ description: 'CEP do endereço (somente números).', example: '69301080' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'CEP deve conter 8 caracteres.' })
  zipCode: string;

  @ApiProperty({ description: 'Nome da rua/avenida.', example: 'Avenida Capitão Ene Garcez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Rua é obrigatória.' })
  street: string;

  @ApiProperty({ description: 'Número do imóvel.', example: '432' })
  @IsString()
  @IsNotEmpty({ message: 'Número é obrigatório.' })
  number: string;

  @ApiProperty({ description: 'Bairro.', example: 'Centro' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Bairro é obrigatório.' })
  district: string;

  @ApiProperty({ description: 'Cidade.', example: 'Boa Vista' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Cidade é obrigatória.' })
  city: string;

  @ApiProperty({ description: 'UF do estado (2 caracteres).', example: 'RR' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'UF deve ter 2 caracteres.' })
  state: string;

  @ApiProperty({ description: 'Complemento do endereço (opcional).', example: 'Apto 101', required: false })
  @IsOptional()
  @IsString()
  complement?: string;
}
