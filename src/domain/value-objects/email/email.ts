import { DomainException } from '@/domain/exceptions/domain-exception';

export default class Email {
  public readonly value: string;
  private static readonly REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(email: string) {
    if (!Email.REGEX.test(email)) throw new DomainException('Invalid email');
    this.value = email.toLowerCase();
  }
}
