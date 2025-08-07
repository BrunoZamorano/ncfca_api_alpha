import { IsNotEmpty, IsNumber, IsOptional, IsString, Length, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto } from '@/domain/dtos/address.dto';
import { Type } from 'class-transformer';

export class CreateClubInputDto {
  @ApiProperty({
    description: 'Nome do novo clube.',
    example: 'Clube de Debate Oradores do Amanhã',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Cidade onde o clube está localizado.',
    example: 'Brasília',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  city: string;

  @ApiProperty({
    description: 'Estado onde o clube está localizado.',
    example: 'DF',
    maxLength: 2,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2)
  state: string;
}

export class CreateClubOutputDto {
  @ApiProperty({
    description: 'Nome do novo clube.',
    example: 'Clube de Debate Oradores do Amanhã',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Número máximo de membros permitidos no clube. Deve ser um número inteiro. Ex: 100',
    example: '30',
  })
  @IsNumber()
  maxMembers: number;

  @ApiProperty({
    description: 'Endereço completo do responsável.',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ description: 'Novo token de acesso JWT.' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Novo token de atualização.' })
  @IsString()
  refreshToken: string;
}
