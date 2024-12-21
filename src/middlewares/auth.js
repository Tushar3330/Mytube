import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","").trim();

    if (!token) {
      throw new ApiError(401, "Unauthorized Access: No token provided");
    }

    // Verify token
    const decodedtoken = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);

    // Find user by ID in decoded token
    const user = await User.findById(decodedtoken?.id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "Unauthorized Access: User not found");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
   
    throw new ApiError(401, 'Error in verifying token');
  }
});
