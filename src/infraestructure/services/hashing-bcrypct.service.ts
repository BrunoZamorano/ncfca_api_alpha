// src/shared/services/hashing/implementations/bcrypt.hashing.service.ts

import * as bcrypt from 'bcryptjs';
import HashingService from '@/domain/services/hashing-service';

export class HashingServiceBcrypt implements HashingService {
  private readonly SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) ?? 10;

  hash(value: string): string {
    const salt = bcrypt.genSaltSync(this.SALT_ROUNDS);
    return bcrypt.hashSync(value, salt);
  }

  compare(value: string, hashedValue: string): boolean {
    return bcrypt.compareSync(value, hashedValue);
  }
}
