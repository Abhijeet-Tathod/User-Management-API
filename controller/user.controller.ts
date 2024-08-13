import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user.model";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { asyncErrorHandler } from "../middleware/asyncErrorMiddleware";
import { CustomError } from "../utils/CustomError";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.services";
import cloudinary from "cloudinary";

// Register User
interface RegisterRequestInterface {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface TokenStrctureInterface {
  token: string;
  activationCode: string;
}

// Function to generate JWT token
const generateToken = (
  user: RegisterRequestInterface
): TokenStrctureInterface => {
  const activationCode = Math.floor(Math.random() * 9000 + 1000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.JWT_SECRET as Secret,
    {
      expiresIn: "1hr",
    }
  );
  return { token, activationCode };
};

// Controller for user registration
export const registerUser = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as RegisterRequestInterface;

      // Check if user with the provided email already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return next(new CustomError("User already exists", 400));
      }

      // Create a new user
      const newUser: RegisterRequestInterface = { name, email, password };

      // Generate JWT token
      const tokenBody = generateToken(newUser);
      const token = tokenBody.token;
      const activationCode = tokenBody.activationCode;

      const data = { user: { name: newUser.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/verify-mail.ejs"),
        { data }
      );

      try {
        // Send mail for activation code
        await sendMail({
          email: newUser.email,
          subject: "Verify Email",
          template: "verify-mail.ejs",
          data,
        });

        res.status(200).json({
          success: true,
          message: `Activation code sent to ${newUser.email}`,
          token,
        });
      } catch (error: any) {
        return next(new CustomError("Failed to send activation email", 400));
      }
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

interface ActivationRequestInterface {
  activation_token: string;
  activation_code: string;
}

// User Activation
export const activateUser = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as ActivationRequestInterface;

      const newUser: {
        user: RegisterRequestInterface;
        activationCode: string;
      } = jwt.verify(activation_token, process.env.JWT_SECRET as string) as {
        user: RegisterRequestInterface;
        activationCode: string;
      };

      if (newUser.activationCode !== activation_code) {
        return next(new CustomError("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return next(new CustomError("User already exists", 400));
      }

      const user = await UserModel.create({ name, email, password });

      res.status(201).json({
        success: true,
        message: "User created successfully",
      });
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

interface LoginRequestInterface {
  email: string;
  password: string;
}

// Controller for user login
export const loginUser = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as LoginRequestInterface;

      if (!email || !password) {
        return next(new CustomError("Plase enter email and password", 400));
      }

      // Check if user with the provided email exists
      const user = await UserModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new CustomError("Invalid email or password", 400));
      }
      // Check if the provided password matches the hashed password
      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return next(new CustomError("Invalid email or password", 400));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

// Logout
export const logoutUser = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("accessToken", "", { maxAge: 1 });
      res.cookie("refreshToken", "", { maxAge: 1 });

      const userId = req.user?._id || "";

      if (userId) {
        await redis.del(userId);
      }

      res.status(200).json({
        success: true,
        message: "Successfully logged out",
      });
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

// validate user role
export const authorizeRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || "";

    if (!roles.includes(userRole)) {
      return next(
        new CustomError(
          `User role ${userRole} is not authorized to access this resource. Allowed roles: ${roles.join(
            ", "
          )}`,
          403
        )
      );
    }
    next();
  };
};

// Update Access Token
export const updateAccessToken = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refreshToken as string;

      // Verify the refresh token
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      if (!decoded) {
        return next(new CustomError("Invalid refresh token", 400));
      }

      // Retrieve session data from Redis
      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(new CustomError("Session not found", 400));
      }

      // Parse user data from session
      const user = JSON.parse(session);

      // Generate new access and refresh tokens
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: "5m",
        }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: "3d",
        }
      );

      req.user = user;

      // Update user session in Redis
      await redis.set(user._id, JSON.stringify(user));

      // Set new tokens in cookies
      res.cookie("accessToken", accessToken, accessTokenOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenOptions);

      // Respond with success message and new access token
      res.status(200).json({
        success: true,
        message: "Access token updated successfully",
        accessToken,
      });
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

// Get User Info
export const getUserInfo = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

// interface for social Auth
interface SocialAuthInterface {
  email: string;
  name: string;
  avatar: string;
}

// Social Auth
export const socialAuth = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as SocialAuthInterface;

      const user = await UserModel.findOne({ email });
      if (!user) {
        const newUser = await UserModel.create({
          email,
          name,
          avatar,
        });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

// User Update Body interface
interface UpdateUserInfoInterface {
  name?: string;
  email?: string;
}

// Update user Info
export const updateUserInfo = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body as UpdateUserInfoInterface;

      const userId = req.user?._id;
      const user = await UserModel.findById(userId);

      // const tokenUser = {
      //   name: user?.name,
      //   email: user?.email,
      //   password: user?.password,
      // };
      // console.log(tokenUser);
      
      if (email && user) {
        const isEmailExists = await UserModel.findOne({ email });
        if (isEmailExists) {
          return next(new CustomError("Email already exists", 400));
        }
        const tokenUser = {
          name: user.name,
          email: user.email,
          password: user.password,
        };
        console.log(tokenUser);

        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        message: "Successfully updated user info",
        user,
      });
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

interface UpdatePasswordInterface {
  oldPassword: string;
  newPassword: string;
}
// Update Password
export const updatePassword = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as UpdatePasswordInterface;

      if (!oldPassword || !newPassword) {
        return next(
          new CustomError("Plase enter old password and new password", 400)
        );
      }

      const user = await UserModel.findById(req.user?._id).select("+password");

      if (user?.password == undefined) {
        return next(new CustomError("Invalid User", 400));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        return next(new CustomError("Invalid password", 400));
      }

      user.password = newPassword;
      await user?.save();
      await redis.set(req.user?.id, JSON.stringify(user));

      res
        .status(201)
        .json({ success: true, message: "Password updated", user });
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);

// Update Profile Picture
interface UpdateAvtarInterface {
  avatar: string;
}

export const updateAvatar = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as UpdateAvtarInterface;

      const userId = req.user?._id;
      const user = await UserModel.findById(userId);

      if (avatar && user) {
        if (user.avatar.profileID) {
          await cloudinary.v2.uploader.destroy(user.avatar.profileID);

          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
          });
          user.avatar = {
            profileID: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
          });
          user.avatar = {
            profileID: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        message: "Successfully updated user avatar",
        user,
      });
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  }
);
