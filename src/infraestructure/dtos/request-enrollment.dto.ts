// src/infraestructure/dtos/request-enrollment.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class RequestEnrollmentDto {
  @ApiProperty({
    description: 'ID do dependente para o qual a matrícula está sendo solicitada.',
    example: 'b1f8b5a0-9c1e-4b8a-8c1a-9c8b8a0c1e2f',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  dependantId: string;

  @ApiProperty({
    description: 'ID do clube no qual a matrícula está sendo solicitada.',
    example: 'c2f9c6b1-8d2f-4b9a-9c2b-9c9b9a1d2f3g',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  clubId: string;
}
