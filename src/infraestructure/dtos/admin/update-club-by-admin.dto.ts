import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from '@/domain/dtos/address.dto';

export class UpdateClubByAdminDto {
  @ApiProperty({
    example: 'Clube de Debate Renovado',
    description: 'Nome do clube',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 25,
    description: 'Número máximo de membros do clube',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Número máximo de membros deve ser maior que 0' })
  maxMembers?: number;

  @ApiProperty({
    description: 'Endereço do clube',
    type: AddressDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
