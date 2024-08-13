// errorMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/CustomError";

export const ErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  // Handle specific errors
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // wrong mongodb id error
  if ((err.name = "CastError")) {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new CustomError(message, 400);
  }

  // Duplicate key error
  else if ((err.code = 11000)) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new CustomError(message, 400);
  }

  // wrong jwt error
  else if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    err = new CustomError(message, 401);
  }

  // Token Expired error
  else if (err.name === "TokenExpiredaError") {
    const message = "Token Expired";
    err = new CustomError(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
