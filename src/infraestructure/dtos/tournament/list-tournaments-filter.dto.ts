import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export class ListTournamentsFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TournamentType)
  type?: TournamentType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showDeleted?: boolean = false;
}
