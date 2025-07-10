import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters long.' })
  reason: string;
}
