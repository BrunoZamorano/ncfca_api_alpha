import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class Data {
  @IsString({ message: 'id deve ser uma string.' })
  @IsNotEmpty({ message: 'id não pode estar vazio.' })
  id: string;

  @IsString({ message: 'status deve ser uma string.' })
  @IsNotEmpty({ message: 'status não pode estar vazio.' })
  status: string;
}

export class PaymentUpdateInputDto {
  @IsString({ message: 'Event deve ser uma string.' })
  @IsNotEmpty({ message: 'Event não pode estar vazio.' })
  event: string;

  @IsString({ message: 'timestamp deve ser uma string.' })
  @IsNotEmpty({ message: 'timestamp não pode estar vazio.' })
  timestamp: string;

  @ValidateNested()
  @Type(() => Data)
  @IsNotEmpty({ message: 'Data não pode estar vazio.' })
  data: Data;
}
