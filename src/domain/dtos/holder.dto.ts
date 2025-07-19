import { ApiProperty } from '@nestjs/swagger';

export class HolderDto {
  @ApiProperty({
    description: 'ID único do titular.',
    format: 'uuid',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do titular.',
    example: 'Maria Silva',
  })
  firstName: string;

  @ApiProperty({
    description: 'Nome do titular.',
    example: 'Maria Silva',
  })
  lastName: string;

  @ApiProperty({
    description: 'Email do titular.',
    example: 'maria.silva@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Telefone do titular.',
    example: '(11) 98888-8888',
  })
  phone: string;
}
