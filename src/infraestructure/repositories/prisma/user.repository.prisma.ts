// src/infraestructure/repositories/user.repository.prisma.ts
import { Injectable } from '@nestjs/common';
import UserRepository from '@/domain/repositories/user-repository';
import User from '@/domain/entities/user/user';
import UserMapper from '@/shared/mappers/user.mapper';
import { PrismaService } from '@/infraestructure/database/prisma.service';

@Injectable()
export class UserRepositoryPrisma implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? UserMapper.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? UserMapper.toEntity(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(UserMapper.toEntity);
  }

  async save(user: User): Promise<User> {
    const userData = UserMapper.toPersistence(user);
    const savedUser = await this.prisma.user.upsert({
      where: { id: user.id },
      update: userData,
      create: userData,
    });
    return UserMapper.toEntity(savedUser);
  }
}