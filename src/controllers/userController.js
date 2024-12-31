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

//controller logic for changing the password
const changecurrentpassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current Password and New Password are required");
  }

  // Find the user
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const ispasswordcorrecrt = await user.comparePassword(currentPassword);

  if (!ispasswordcorrecrt) {
    throw new ApiError(400, "Invalid Current Password");
  }

  // Update the password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

//getting the user profile
const getCurrentuser = asyncHandler(async (req, res) => {
  // const user = await User.findById(req.user._id).select("-password -refreshToken");

  // if (!user) {
  //   throw new ApiError(404, "User not found");
  // }

  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "User Profile Retrieved Successfully")
    );
});

//updating the user profile
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username, email } = req.body;

  if ([fullName, username, email].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const updateduser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        username,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password ");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateduser, "User Profile Updated Successfully")
    );
});

//updating the avatar file
const updateavatar = asyncHandler(async (req, res) => {
  const avatarpath = req.file?.path;

  if (!avatarpath) {
    throw new ApiError(401, "Avatar file is missing");
  }

  const avatar = await uploadoncloudinary(avatarpath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading the avatar");
  }

  const updatedavatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedavatar, "Avatar Updated Successfully"));
});

//updating the avatar cover image file
const updatecoverimage = asyncHandler(async (req, res) => {
  const coverimagepath = req.file?.path;

  if (!avatarpath) {
    throw new ApiError(401, "CoverImage file is missing");
  }

  const coverimage = await uploadoncloudinary(coverimagepath);

  if (!coverimage.url) {
    throw new ApiError(400, "Error while uploading the Cover Image");
  }

  const updatedavatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverimage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  //rteurn the resposne

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedavatar, "Cover Image Updated Successfully")
    );
});

//get user channel profile detais
const getUserchannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  //using aggreation pipeline to get the user details

  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedto",
      },
    },

    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedtoCount: {
          $size: "$subscribedto",
        },

        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },

    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedtoCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel Profile Retrieved Successfully")
    );
});

//get user watch history
const getuserwatchhistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History Retrieved Successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutuser,
  refresaccesshtoken,
  changecurrentpassword,
  getCurrentuser,
  updateAccountDetails,
  updateavatar,
  updatecoverimage,
  getUserchannelProfile,
  getuserwatchhistory
};
