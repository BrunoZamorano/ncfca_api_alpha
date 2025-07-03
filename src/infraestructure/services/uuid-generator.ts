import IdGenerator from '@/application/services/id-generator';

export default class UuidGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
