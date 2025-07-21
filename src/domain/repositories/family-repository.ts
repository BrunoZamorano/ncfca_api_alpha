import Family from '@/domain/entities/family/family';
import Dependant from '@/domain/entities/dependant/dependant';

export default interface FamilyRepository {
  findByHolderId(id: string): Promise<Family | null>;
  findDependant(dependantId: string): Promise<Dependant | null>;
  save(family: Family): Promise<Family>;
  find(id: string): Promise<Family | null>;
  findAll(): Promise<Family[]>;
}
