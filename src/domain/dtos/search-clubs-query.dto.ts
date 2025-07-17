// src/domain/dtos/search-clubs-query.dto.ts

import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import PaginationDto from '@/domain/dtos/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

class SearchClubsFilterDto {
  @ApiPropertyOptional({
    description: 'Filtra clubes pelo nome (busca parcial, case-insensitive).',
    example: 'Oradores',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtra clubes pela cidade (busca exata, case-insensitive).',
    example: 'Brasília',
  })
  @IsOptional()
  @IsString()
  city?: string;
}

export default class SearchClubsQueryDto {
  @ApiPropertyOptional({
    description: 'Container para os filtros de busca de clubes.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchClubsFilterDto)
  filter?: SearchClubsFilterDto;

  @ApiPropertyOptional({
    description: 'Container para os parâmetros de paginação.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}
