import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import PaginationDto from '@/domain/dtos/pagination.dto';
import { ListTournamentsFilterDto } from './list-tournaments-filter.dto';

export class ListTournamentsQueryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ListTournamentsFilterDto)
  filter?: ListTournamentsFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}