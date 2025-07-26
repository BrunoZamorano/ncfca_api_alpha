import { ApiProperty } from '@nestjs/swagger';

export class DependantsListItemView {
  @ApiProperty({ description: 'Email do dependente', example: 'dependente@example.com' })
  email: string;

  @ApiProperty({ description: 'Nome completo do dependente', example: 'João Silva' })
  name: string;

  @ApiProperty({ description: 'ID único do dependente', format: 'uuid' })
  id: string;
}
