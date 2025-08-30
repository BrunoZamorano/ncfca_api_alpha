import { ApiProperty } from '@nestjs/swagger';

export class AcceptDuoRegistrationResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação da aceitação da inscrição',
    example: 'Inscrição de dupla aceita com sucesso',
  })
  message: string;
}
