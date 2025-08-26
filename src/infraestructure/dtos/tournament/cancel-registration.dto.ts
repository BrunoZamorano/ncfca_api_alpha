import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelRegistrationDto {
  @ApiProperty({
    description: 'ID da inscrição a ser cancelada',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ApiProperty({
    description: 'Motivo do cancelamento da inscrição',
    example: 'Conflito de agenda',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
