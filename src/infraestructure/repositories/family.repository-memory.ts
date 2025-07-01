import { Injectable } from '@nestjs/common';

import FamilyRepository from '@/domain/repositories/family-repository';
import Family from '@/domain/entities/family/family';

@Injectable()
export default class FamilyRepositoryMemory implements FamilyRepository {
  private families: Family[];

  constructor(families?: Family[]) {
    this.families = families ?? this.populate();
  }

  async create(family: Family): Promise<Family> {
    this.families.push(family);
    const createdFamily = this.families.find((p) => p.id === family.id) ?? null;
    if (!createdFamily) throw new Error('USER_NOT_CREATED');
    return createdFamily;
  }

  async save(family: Family): Promise<Family> {
    const existingIndex = this.families.findIndex((p) => p.id === family.id);
    if (existingIndex === -1) return this.create(family);
    this.families[existingIndex] = family;
    return this.families[existingIndex];
  }

  async findByHolderId(id: string): Promise<Family | null> {
    return this.families.find((p) => p.holderId === id) ?? null;
  }

  private populate(): Family[] {
    return new Array(10).fill(0).map((_, i) => new Family({ id: `${++i}`, holderId: `${i}` }));
  }
}
