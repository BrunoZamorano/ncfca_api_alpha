import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestIndividualRegistrationInputDto {
  @ApiProperty({
    description: 'ID do torneio para o qual deseja se registrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  tournamentId: string;

  @ApiProperty({
    description: 'ID do competidor (dependente) que será registrado',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  @IsNotEmpty()
  competitorId: string;
}

export class RequestIndividualRegistrationOutputDto {
  @ApiProperty({
    description: 'ID único da inscrição individual criada',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ApiProperty({
    description: 'Status atual da inscrição individual',
    example: 'CONFIRMED',
    enum: ['CONFIRMED'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}
