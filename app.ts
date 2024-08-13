import express, {
  Request,
  Response,
  Application,
  NextFunction,
} from "express";
export const app: Application = express();
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.route";
import { CustomError } from "./utils/CustomError";
require("dotenv").config();

// body parser
app.use(express.json({ limit: "50mb" }));

// cookies parser
app.use(cookieParser());

// Cors
app.use(cors({ origin: process.env.ORIGIN }));

// Routes
app.use("/api/v1", userRouter);

// Testing
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ success: true, message: "Welcome to my Server" });
});

/* The commented out code block `app.all("*", ...)` is a middleware function in Express that is
designed to handle all HTTP methods for any route that hasn't been matched by previous routes. In
this specific case, it is set up to handle any incoming request that doesn't match any defined
routes. */
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  return next(new CustomError(`Route ${req.originalUrl} not found`,404))
});
