import Family from '../entities/family/family';

export default interface FamilyRepository {
  findByHolderId(id: string): Promise<Family | null>;
  save(family: Family): Promise<Family>;
  find(id: string): Promise<Family | null>;
}
