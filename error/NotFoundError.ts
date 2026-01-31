import AppError from "./AppError";

class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message);
    this.statusCode = 404;
  }
}

export default NotFoundError;
