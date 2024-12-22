import { asyncHandler } from "../utils/asynchandler.js";
import User from "../models/user.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

//method for creation of access token and refresh token
const generateAcessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //save the refresh token to the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

//register controller logic
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

  console.log(req.files);

  //check for image file and avatar
  const avatarlocalpath = req.files?.avatar[0]?.path;
  // const coverimagelocalpath = req.files?.coverImage[0]?.path;

  let coverimagelocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverimagelocalpath = req.files.coverImage[0].path;
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
    avatar: avatar.url,
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

//login controller logic
const loginUser = asyncHandler(async (req, res) => {
  // Retrieve details from the request body
  const { email, username, password } = req.body;

  // Validate the details
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required");
  }

  // Find the user
  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if the password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAcessandRefreshToken(
    user._id
  );

  // Get the logged-in user details without sensitive fields
  const loggedinuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Set cookie options
  const options = {
    httpOnly: true,
    secure: true, // Secure only in production
  };

  // Send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinuser,
          accessToken,
          refreshToken,
        },
        "User Logged in Successfully"
      )
    );
});

//logout controller logic
const logoutuser = asyncHandler(async (req, res) => {
  //removing accesstoken from the database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  //now removing from the cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//inorder when the token is expired we need to refresh the token and generate new access token
//this is the controller logic for the same
const refresaccesshtoken = asyncHandler(async (req, res) => {
  const incomingrefreshtoken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingrefreshtoken) {
    throw new ApiError(400, "Refresh token is required");
  }

  try {
    //verify the refresh token
    const decodedtoken = jwt.verify(
      incomingrefreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedtoken?.id);

    if (!user) {
      throw new ApiError(404, "Invalid Refresh Token ");
    }

    if (user?.refreshToken !== incomingrefreshtoken) {
      throw new ApiError(401, " Refresh Token used or expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } = await generateAcessandRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: user,
            accessToken,
            refreshToken: newrefreshToken,
          },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
});

export { registerUser, loginUser, logoutuser , refresaccesshtoken };





