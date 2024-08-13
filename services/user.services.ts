import { Response } from "express";
import { redis } from "../utils/redis";

export const getUserById = async (userId: string, res: Response) => {
  const userJSON = await redis.get(userId as string);
  if (userJSON) {
    const user = JSON.parse(userJSON);
    return res.status(201).json({ success: true, user });
  }
};
