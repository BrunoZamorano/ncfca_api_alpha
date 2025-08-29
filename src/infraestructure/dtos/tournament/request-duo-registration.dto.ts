import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestDuoRegistrationInputDto {
  @ApiProperty({
    description: 'ID do torneio para o qual deseja se registrar a dupla',
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

  @ApiProperty({
    description: 'ID do parceiro (dependente) que será convidado para formar a dupla',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsString()
  @IsNotEmpty()
  partnerId: string;
}

export class RequestDuoRegistrationOutputDto {
  @ApiProperty({
    description: 'ID único da inscrição de dupla criada',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ApiProperty({
    description: 'Status atual da inscrição da dupla',
    example: 'PENDING_APPROVAL',
    enum: ['PENDING_APPROVAL'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}

// Keep backward compatibility
export class RequestDuoRegistrationDto extends RequestDuoRegistrationInputDto {}
