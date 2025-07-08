import HashingService from '@/domain/services/hashing-service';

export default class AnemicHashingService implements HashingService {
  private readonly secret: string = 'secret';

  hash(value: string): string {
    return value + this.secret;
  }
  compare(value: string, hashedValue: string): boolean {
    return value === hashedValue.replace(this.secret, '');
  }
}
