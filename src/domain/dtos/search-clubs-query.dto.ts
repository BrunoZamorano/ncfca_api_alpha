import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import PaginationDto from '@/domain/dtos/pagination.dto';

class SearchClubsFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export default class SearchClubsQueryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchClubsFilterDto)
  filter?: SearchClubsFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}
