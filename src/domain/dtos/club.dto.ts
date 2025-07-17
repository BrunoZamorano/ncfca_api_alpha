// src/domain/dtos/club.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export default class ClubDto {
  @ApiProperty({
    description: 'ID único do clube.',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Nome oficial do clube.',
    example: 'Clube de Debate Oradores do Amanhã',
  })
  name: string;

  @ApiProperty({
    description: 'Cidade de localização do clube.',
    example: 'Brasília',
  })
  city: string;

  @ApiProperty({
    description: 'Estado de localização do clube.',
    example: 'DF',
  })
  state: string;

  @ApiProperty({
    description: 'ID do usuário que é o diretor do clube (principal).',
    format: 'uuid',
    example: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  principalId: string;
}
