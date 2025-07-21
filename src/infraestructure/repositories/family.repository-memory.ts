import { Injectable } from '@nestjs/common';

import FamilyRepository from '@/domain/repositories/family-repository';
import Family from '@/domain/entities/family/family';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';
import { FamilyStatus } from '@/domain/enums/family-status';
import Dependant from '@/domain/entities/dependant/dependant';

@Injectable()
export default class FamilyRepositoryMemory implements FamilyRepository {
  private readonly db: InMemoryDatabase;

  constructor(families?: Family[]) {
    this.db = InMemoryDatabase.getInstance();
    const initialFamilies = families ?? this.populate();
    this.db.families.push(...initialFamilies);
  }
  findDependant(dependantId: string): Promise<Dependant | null> {
    throw new Error('Method not implemented.');
  }

  async create(family: Family): Promise<Family> {
    this.db.families.push(family);
    const createdFamily = this.db.families.find((p) => p.id === family.id) ?? null;
    if (!createdFamily) throw new Error('USER_NOT_CREATED');
    return createdFamily;
  }

  async find(id: string): Promise<Family | null> {
    return this.db.families.find((p) => p.id === id) ?? null;
  }

  async findAll(): Promise<Family[]> {
    return this.db.families;
  }

  async save(family: Family): Promise<Family> {
    const existingIndex = this.db.families.findIndex((p) => p.id === family.id);
    if (existingIndex === -1) return this.create(family);
    this.db.families[existingIndex] = family;
    return this.db.families[existingIndex];
  }

  async findByHolderId(id: string): Promise<Family | null> {
    return this.db.families.find((p) => p.holderId === id) ?? null;
  }

  private populate(): Family[] {
    return new Array(10)
      .fill(0)
      .map((_, i) => new Family({ id: `${++i}`, holderId: `${i}`, status: FamilyStatus.NOT_AFFILIATED }));
  }
}
