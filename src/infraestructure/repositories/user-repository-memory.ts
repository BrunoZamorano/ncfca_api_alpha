import { Injectable } from '@nestjs/common';

import UserRepository from '@/domain/repositories/user-repository';
import User, { CreateUserProps } from '@/domain/entities/user/user';

import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

@Injectable()
export default class UserRepositoryMemory implements UserRepository {
  private readonly db: InMemoryDatabase;

  constructor() {
    this.db = InMemoryDatabase.getInstance();
  }

  async find(id: string): Promise<User | null> {
    return this.db.users.find((p) => p.id === id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return this.db.users ?? [];
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.users.find((p) => p['_email'].value === email) ?? null;
  }

  async save(user: User): Promise<User> {
    const existingIndex = this.db.users.findIndex((p) => p.id === user.id);
    if (existingIndex !== -1) {
      this.db.users[existingIndex] = user;
    } else {
      if (this.db.users.some((p) => p['_email'].value === user.email)) throw new Error('EMAIL_ALREADY_IN_USE');
      this.db.users.push(user);
    }
    return user;
  }

  public populate(userFactory: UserFactory): void;
  public populate(userFactory: UserFactory, length: number): void;
  public populate(userFactory: UserFactory, props: CreateUserProps[]): void;
  public populate(userFactory: UserFactory, props: CreateUserProps, length: number): void;
  public populate(userFactory: UserFactory, arg1?: number | CreateUserProps | CreateUserProps[], arg2?: number): void {
    if (typeof arg1 === 'undefined' || typeof arg1 === 'number') {
      const length = arg1 ?? 10;
      for (let i = 0; i < length; i++) {
        this.db.users.push(userFactory.create({}));
      }
      return;
    }
    if (Array.isArray(arg1)) {
      for (const userProps of arg1) {
        this.db.users.push(userFactory.create(userProps));
      }
      return;
    }
    if (typeof arg1 === 'object' && arg1 !== null) {
      const templateProps = arg1;
      const length = arg2 ?? 1;
      for (let i = 0; i < length; i++) {
        this.db.users.push(userFactory.create(templateProps));
      }
      return;
    }
  }
}
interface UserFactory {
  create: (props: CreateUserProps) => User;
}
