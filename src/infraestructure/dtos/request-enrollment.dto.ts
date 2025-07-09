import { IsUUID } from 'class-validator';

export class RequestEnrollmentDto {
  @IsUUID()
  dependantId: string;

  @IsUUID()
  clubId: string;
}