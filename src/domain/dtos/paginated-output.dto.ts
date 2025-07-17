// src/domain/dtos/paginated-output.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import ClubDto from './club.dto';
import { UserDto } from './user.dto';
import { FamilyDto } from './family.dto';
import { EnrollmentRequestDto } from './enrollment-request.dto';

export class PaginationMetaDto {
  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: 250 })
  total: number;

  @ApiProperty({ example: 100 })
  limit: number;

  @ApiProperty({ example: 1 })
  page: number;
}

export class PaginatedClubDto {
  @ApiProperty({ isArray: true, type: ClubDto })
  data: ClubDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PaginatedUserDto {
  @ApiProperty({ isArray: true, type: UserDto })
  data: UserDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PaginatedFamilyDto {
  @ApiProperty({ isArray: true, type: FamilyDto })
  data: FamilyDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PaginatedEnrollmentDto {
  @ApiProperty({ isArray: true, type: EnrollmentRequestDto })
  data: EnrollmentRequestDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
