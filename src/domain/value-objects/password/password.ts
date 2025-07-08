import { DomainException } from '@/domain/exceptions/domain-exception';
import HashingService from '@/domain/services/hashing-service';

export default class Password {
  public readonly value: string;
  private static readonly MIN_LENGTH = 8;
  private static readonly REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

  private constructor(hashedValue: string) {
    this.value = hashedValue;
  }

  public static create(plainText: string, hashingService: HashingService): Password {
    if (plainText.length < this.MIN_LENGTH) throw new DomainException(Password.errorCodes.PASSWORD_TOO_SHORT);
    if (!this.REGEX.test(plainText)) throw new DomainException(Password.errorCodes.PASSWORD_DOES_NOT_MEET_CRITERIA);
    const hash = hashingService.hash(plainText);
    return new Password(hash);
  }

  public static fromHash(hash: string): Password {
    return new Password(hash);
  }

  public compare(plainText: string, hashingService: HashingService): boolean {
    return hashingService.compare(plainText, this.value);
  }

  static errorCodes = {
    PASSWORD_DOES_NOT_MEET_CRITERIA: 'PASSWORD_DOES_NOT_MEET_CRITERIA',
    PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  };
}
