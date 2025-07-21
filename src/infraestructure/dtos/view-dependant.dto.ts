import { ApiProperty } from '@nestjs/swagger';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';
import { HolderDto } from '@/domain/dtos/holder.dto';

export class ViewDependantOutputDto {
  @ApiProperty({
    description: 'ID único do dependente.',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({ description: 'Primeiro nome do dependente.', example: 'João' })
  firstName: string;

  @ApiProperty({ description: 'Último nome do dependente.', example: 'Silva Filho' })
  lastName: string;

  @ApiProperty({
    description: 'Data de nascimento do dependente.',
    type: 'string',
    format: 'date-time',
    example: '2010-01-20T00:00:00.000Z',
  })
  birthdate: Date;

  @ApiProperty({
    description: 'Relação de parentesco com o responsável.',
    enum: DependantRelationship,
    example: DependantRelationship.SON,
  })
  relationship: DependantRelationship;

  @ApiProperty({ description: 'Sexo do dependente.', enum: Sex, example: Sex.MALE })
  sex: Sex;

  @ApiProperty({
    description: 'Email de contato do dependente (opcional).',
    required: false,
    example: 'joao.filho@example.com',
  })
  email: string | null;

  @ApiProperty({
    description: 'Telefone de contato do dependente (opcional).',
    required: false,
    example: '11999998888',
  })
  phone: string | null;

  @ApiProperty({
    description: 'ID da família à qual o dependente pertence.',
    format: 'uuid',
    example: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  familyId: string;

  @ApiProperty({
    description: 'Dados do titular.',
    type: () => HolderDto,
  })
  holder: HolderDto;
}
