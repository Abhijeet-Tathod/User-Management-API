import { NextFunction, Request, Response } from "express";
import { CustomError } from "../utils/CustomError";
import { asyncErrorHandler } from "./asyncErrorMiddleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";

// Authenticated User
export const isAuthenticated = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies.accessToken as string;

      if (!accessToken) {
        return next(
          new CustomError("Please login to access this resourse", 401)
        );
      }

      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN as string
      ) as JwtPayload;

      if (!decoded) {
        return next(new CustomError("Access token is not valid", 401));
      }

      const user = await redis.get(decoded.id as string);

      if (!user) {
        return next(new CustomError("User session not found", 400));
      }

      req.user = JSON.parse(user);
      next();
    } catch (err: any) {
      return next(new CustomError(err.message, 400));
    }
  }
);
