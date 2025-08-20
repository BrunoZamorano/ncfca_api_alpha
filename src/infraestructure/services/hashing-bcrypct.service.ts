// src/shared/services/hashing/implementations/bcrypt.hashing.service.ts

import * as bcrypt from 'bcryptjs';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import HashingService from '@/domain/services/hashing-service';

@Injectable()
export class HashingServiceBcrypt implements HashingService {
  private readonly SALT_ROUNDS: number;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.SALT_ROUNDS = this.configService.get<number>('BCRYPT_SALT_ROUNDS') ?? 10;
  }

  hash(value: string): string {
    const salt = bcrypt.genSaltSync(this.SALT_ROUNDS);
    return bcrypt.hashSync(value, salt);
  }

  compare(value: string, hashedValue: string): boolean {
    return bcrypt.compareSync(value, hashedValue);
  }
}
