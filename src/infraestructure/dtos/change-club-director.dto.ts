import { IsNotEmpty, IsUUID } from 'class-validator';

export class ChangeClubDirectorDto {
  @IsUUID()
  @IsNotEmpty()
  newDirectorId: string;
}
