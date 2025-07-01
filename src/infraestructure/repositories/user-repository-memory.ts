import UserRepository from '@/domain/repositories/user-repository';
import User from '@/domain/entities/user/user';

export default class UserRepositoryMemory implements UserRepository {
  private users: User[];

  constructor(users?: User[]) {
    this.users = users ?? this.populate();
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.users.length === 0) return null;
    return this.users.find((p) => p.email === email) ?? null;
  }

  async create(user: User): Promise<User> {
    this.users.push(user);
    const createdUser = this.users.find((p) => p.id === user.id);
    if (!createdUser) throw new Error('USER_NOT_CREATED');
    return createdUser;
  }

  async save(user: User): Promise<User> {
    const existingUser = await this.findByEmail(user.email);
    return existingUser ?? (await this.create(user));
  }

  async update(user: User): Promise<User> {
    this.users.push(user);
    const createdUser = this.users.find((p) => p.id === user.id);
    if (!createdUser) throw new Error('USER_NOT_CREATED');
    return createdUser;
  }

  private populate(): User[] {
    return Array.from({length: 10}, (_, i) => new User({ id: `${++i}`, email: `${i}@email.com` }));
  }
}
