// src/domain/dtos/search-users-query.dto.ts

import { IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import PaginationDto from '@/domain/dtos/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoles } from '@/domain/enums/user-roles';

class SearchUsersFilterDto {
  @ApiPropertyOptional({
    description: 'Filtra usuários pelo nome (busca parcial, case-insensitive).',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtra usuários pelo email (busca parcial, case-insensitive).',
    example: 'joao@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filtra usuários pelo CPF (busca exata).',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Filtra usuários pelo RG (busca exata).',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  rg?: string;

  @ApiPropertyOptional({
    description: 'Filtra usuários pela função/role.',
    enum: UserRoles,
    example: UserRoles.SEM_FUNCAO,
  })
  @IsOptional()
  @IsEnum(UserRoles)
  role?: UserRoles;
}

export default class SearchUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Container para os filtros de busca de usuários.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchUsersFilterDto)
  filter?: SearchUsersFilterDto;

  @ApiPropertyOptional({
    description: 'Container para os parâmetros de paginação.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}