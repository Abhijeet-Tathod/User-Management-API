import mongoose from "mongoose";
require("dotenv").config();

const dbURL: string = process.env.DB_URL as string;

export const connectDb = async () => {
  try {
    await mongoose.connect(dbURL);
    console.log("DB Connected");
  } catch (e) {    
    console.log(e);
  }
};
