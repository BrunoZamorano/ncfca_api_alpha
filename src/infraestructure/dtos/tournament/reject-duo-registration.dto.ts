import { ApiProperty } from '@nestjs/swagger';

export class RejectDuoRegistrationResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação da rejeição da inscrição',
    example: 'Inscrição de dupla rejeitada com sucesso',
  })
  message: string;
}
