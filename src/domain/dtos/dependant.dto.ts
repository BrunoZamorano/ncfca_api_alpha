import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';

export default interface DependantDto {
  id: string;
  sex: Sex;
  email?: string;
  phone?: string;
  firstName: string;
  familyId: string;
  lastName: string;
  birthdate: Date;
  relationship: DependantRelationship;
}
