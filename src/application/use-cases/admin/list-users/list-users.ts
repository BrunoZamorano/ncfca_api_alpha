import { Inject, Injectable } from '@nestjs/common';
import UserRepository from '@/domain/repositories/user-repository';
import { USER_REPOSITORY } from '@/shared/constants/repository-constants';
import User from '@/domain/entities/user/user';

@Injectable()
export default class AdminListUsers {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}
  async execute(): Promise<User[]> {
    return await this.userRepository.findAll();
  }
}
