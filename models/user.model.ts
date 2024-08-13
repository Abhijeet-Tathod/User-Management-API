// userModel.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
require("dotenv").config();

// Define interface for user document
export interface User extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    profileID: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseID: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignRefreshToken: () => string;
  SignAccessToken: () => string;
}

// Define user schema
const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: (value: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(value);
      },
      message: "Please enter a valid email",
    },
    password: {
      type: String,
      minLength: [8, "Password must be at least 8 characters"],
      select: true,
    },
    avatar: {
      profileID: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseID: String,
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving user
userSchema.pre<User>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "5m",
  });
};

userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d",
  });
};

// Compare password with hashed password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Define user model
const UserModel: Model<User> = mongoose.model<User>("User", userSchema);

export default UserModel;
