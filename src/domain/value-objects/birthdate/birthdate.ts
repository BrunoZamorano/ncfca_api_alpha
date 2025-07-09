import { DomainException } from '@/domain/exceptions/domain-exception';

export default class Birthdate {
  public readonly value: Date;

  constructor(dateString: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new DomainException('Invalid birthdate format');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) throw new DomainException('Birthdate cannot be in the future');
    this.value = date;
  }
}
