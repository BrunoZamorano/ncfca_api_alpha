// src/infraestructure/dtos/reject-enrollment.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectEnrollmentDto {
  @ApiProperty({
    description: 'Motivo detalhado para a rejeição da matrícula. Mínimo de 10 caracteres.',
    example: 'Infelizmente, todas as vagas para esta faixa etária já foram preenchidas.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters long.' })
  reason: string;
}
