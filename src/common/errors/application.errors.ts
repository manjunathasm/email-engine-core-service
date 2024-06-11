import { ValidationError } from 'class-validator';
import { CRUDMethod, ERROR_CODE } from 'src/common/constants';

export class ApplicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly meta: any = null,
  ) {
    super(message);
    this.code = code;
    this.meta = meta;
    this.name = 'ApplicationError';
  }
}

export class MethodNotAllowedError extends ApplicationError {
  constructor(
    methodName: CRUDMethod,
    resourceName?: string,
    meta?: Record<string, any>,
  ) {
    super(
      ERROR_CODE.METHOD_NOT_ALLOWED,
      `${methodName} is not allowed for ${resourceName || 'this resource'}`,
      meta,
    );
  }
}

export class ClassValidatorError extends ApplicationError {
  private static formatErrorMessages(errors: ValidationError[]): string {
    return errors
      .map((error: ValidationError): string => {
        return error.constraints && error.constraints instanceof Object
          ? Object.values(error.constraints).join(', ')
          : '';
      })
      .join(', ');
  }

  constructor(errors: ValidationError[]) {
    super(
      ERROR_CODE.VALIDATION,
      ClassValidatorError.formatErrorMessages(errors),
    );
  }
}

export class ApplicationValidationError extends ApplicationError {
  constructor(message: string, meta?: unknown) {
    super(ERROR_CODE.VALIDATION, message, meta);
  }
}
