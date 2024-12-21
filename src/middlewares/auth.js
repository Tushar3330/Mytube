import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import  jwt  from 'jsonwebtoken';
import User from './../models/user.js';

export const verifyJWT = asyncHandler(async (req, res, next) => 
    {
      try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "");
        if (!token) {
            throw new ApiError(401 , "Unauthorized Acess")
            
        }
     
        const decodedtoken = jwt.verify(token , process.env.ACESS_TOKEN_SECRET);

        const user = await User.findById(decodedtoken?._id).select("-password -refreshToken");
        
        if(!user)
        {
            throw new ApiError(401 , "Unauthorized Acess");
        }

        req.user = user;
        next();

      } catch (error) {
        throw new ApiError(401 , "Invalid Access Acess");
        
      }
});
