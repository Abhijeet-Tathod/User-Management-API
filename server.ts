import { app } from "./app";
import dotenv from "dotenv";
import { connectDb } from "./utils/db";
import { ErrorHandler } from "./middleware/errorHandler";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";

const port = process.env.PORT || 8000;

app.use(ErrorHandler);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.listen(port, () => {
  console.log(`Server is Fire at Port : ${port}`);
  connectDb();
});
