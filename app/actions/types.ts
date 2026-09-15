export type ActionErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export interface ActionError {
  code: ActionErrorCode | string;
  message: string;
}

export type ActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ActionError;
    };

