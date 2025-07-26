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
    try {
      const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      return user ? UserMapper.toEntity(user) : null;
    } catch (error) {
      // Handle specific error cases if needed
      console.error(`Error finding user by email: ${email}`, error);
      return null; // or throw a custom exception if preferred
    }
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { cpf } });
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
