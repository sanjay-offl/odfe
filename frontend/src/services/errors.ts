export class ApiError extends Error {
  code: string;
  constructor(message: string, code = 'api_error') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 'forbidden');
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 'validation');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'We could not find that record.') {
    super(message, 'not_found');
    this.name = 'NotFoundError';
  }
}

export class PaymentError extends ApiError {
  constructor(message = 'The payment could not be completed. No charge was made.') {
    super(message, 'payment_failed');
    this.name = 'PaymentError';
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong. Please try again.';
}
