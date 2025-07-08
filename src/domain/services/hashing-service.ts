export default interface HashingService {
  hash(value: string): string;

  compare(value: string, hashedValue: string): boolean;
}
