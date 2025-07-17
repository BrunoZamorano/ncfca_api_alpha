// src/infraestructure/dtos/change-club-director.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ChangeClubDirectorDto {
  @ApiProperty({
    description: 'ID do usuário que será o novo diretor do clube.',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  newDirectorId: string;
}
