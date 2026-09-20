// server/src/domain/errors.ts

export class DomainError extends Error {
  constructor(public message: string, public statusCode: number, public code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}