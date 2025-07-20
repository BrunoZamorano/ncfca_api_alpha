import { ApiProperty } from '@nestjs/swagger';
import { HolderDto } from '@/domain/dtos/holder.dto';
import { Sex } from '@/domain/enums/sex';

export class ClubMemberDto {
  @ApiProperty({
    description: 'ID único do membro.',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Sobrenome do membro.',
    example: 'Silva',
  })
  lastName: string;

  @ApiProperty({
    description: 'Nome do membro.',
    example: 'João',
  })
  firstName: string;

  @ApiProperty({
    description: 'Email do membro.',
    example: 'joao.silva@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Telefone do membro.',
    example: '(11) 99999-9999',
  })
  phone: string;

  @ApiProperty({
    description: 'Dados do titular.',
    type: () => HolderDto,
  })
  holder: HolderDto;

  @ApiProperty({
    description: 'Data de início da associação.',
    type: 'string',
    format: 'date-time',
    example: '2023-01-15T10:00:00Z',
  })
  memberSince: Date;

  @ApiProperty({
    description: 'Data de nascimento do membro.',
    type: 'string',
    format: 'date-time',
    example: '1990-01-15T00:00:00Z',
  })
  birthDate: Date;

  @ApiProperty({
    description: 'Sexo do membro.',
    enum: Sex,
    example: Sex.MALE,
  })
  sex: Sex;
}
