export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found.`);
  }
}

export class InvalidOperationException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class OptimisticLockError extends DomainException {
  constructor(entity: string, id: string) {
    super(`Optimistic lock error: ${entity} with id ${id} has been modified by another process.`);
  }
}
