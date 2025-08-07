import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectRequestDto {
  @ApiProperty({
    description: 'Motivo detalhado para a rejeição. Mínimo de 10 caracteres.',
    example: 'A documentação fornecida está incompleta.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'O motivo da rejeição deve ter pelo menos 10 caracteres.' })
  reason: string;
}
