import { asyncHandler } from "../utils/asynchandler.js";
import User from "../models/user.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get details from the request body
  const { fullName, username, email, password } = req.body;

  //validate the details
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if the user already exists:usrename or email
  const existeduser = await User.findOne({ $or: [{ username }, { email }] });

  if (existeduser) {
    throw new ApiError(409, "User already exists");
  }

  //check for image file and avatar
  const avatarlocalpath = req.files?.avatar[0]?.path;
  // const coverimagelocalpath = req.files?.coverImage[0]?.path;


  let coverimagelocalpath ;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
   {
    coverimagelocalpath = req.files?.coverImage[0]?.path;
   }


  if (!avatarlocalpath) { 
    throw new ApiError(400, "Avatar is required");
  }

  //   if there upload to cloudinary
  const avatar = await uploadoncloudinary(avatarlocalpath);
  const coverImage = await uploadoncloudinary(coverimagelocalpath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //create user object - create entry in db
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    avatar:avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
  });

  //here we can check if the user is created and also remove the filed which we want to\
  //remove password and refresh token from the response
  const usercreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check for user creation
  if (!usercreated) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  //return response
  return res
    .status(201)
    .json(new ApiResponse(200, usercreated, "User created successfully"));
});

export { registerUser };
