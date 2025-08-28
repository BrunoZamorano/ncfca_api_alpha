export interface DomainEvent<T> {
  readonly eventType: string;
  readonly payload: T;
}
