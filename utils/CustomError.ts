export class CustomError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
    // Error.captureStackTrace(this, this.constructor)
  }

  serializeError() {
    return [{ message: this.message }];
  }
}
