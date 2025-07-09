import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';

export class AddDependantDto {
  @IsString({ message: 'First name must be a string.' })
  @MinLength(2, { message: 'First name must be at least 2 characters long.' })
  firstName: string;

  @IsString({ message: 'Last name must be a string.' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
  lastName: string;

  @IsDateString({}, { message: 'Birth date must be a valid date string.' })
  birthdate: string;

  @IsEnum(DependantRelationship, { message: 'Relationship must be a valid dependant relationship.' })
  relationship: DependantRelationship;

  @IsEnum(Sex, { message: 'Sex must be a valid sex value.' })
  sex: Sex;

  @IsString({ message: 'Email must be a string.' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Phone must be a string.' })
  @IsOptional()
  phone?: string;
}
