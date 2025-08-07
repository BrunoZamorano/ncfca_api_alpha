import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, Max, Min, MinLength, ValidateNested } from 'class-validator';
import { AddressDto } from '@/domain/dtos/address.dto';

export class CreateClubRequestDto {
  @ApiProperty({
    description: 'Nome desejado para o novo clube.',
    example: 'Clube de Debate Principia',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  clubName: string;

  @ApiProperty({
    description: 'Número máximo de membros para o clube.',
    example: 50,
    minimum: 1,
  })
  @IsOptional()
  @IsNotEmpty()
  @Min(1)
  maxMembers?: number;

  @ApiProperty({
    description: 'Endereço de localização do clube.',
    type: AddressDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
