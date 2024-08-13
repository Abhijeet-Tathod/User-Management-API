import express from "express";
import {
  loginUser,
  registerUser,
  activateUser,
  logoutUser,
  authorizeRole,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateAvatar,
} from "../controller/user.controller";
import { isAuthenticated } from "../middleware/auth";
const userRouter = express.Router();

// Authentication routes
userRouter.post("/register", registerUser);

userRouter.post("/activate", activateUser);

userRouter.post("/login", loginUser);

userRouter.get("/logout", isAuthenticated, logoutUser);

userRouter.get("/updatetoken", updateAccessToken);

userRouter.get("/user", isAuthenticated, getUserInfo);

userRouter.post("/socialauth", socialAuth);

userRouter.put("/updateprofile", isAuthenticated, updateUserInfo);

userRouter.put("/updatepassword", isAuthenticated, updatePassword);

userRouter.put("/updateavatar", isAuthenticated, updateAvatar);
export default userRouter;
