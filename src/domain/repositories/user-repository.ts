import User from '@/domain/entities/user/user';

export default interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  find(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
