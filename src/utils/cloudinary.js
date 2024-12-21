import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Function to upload file on cloudinary
const uploadoncloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;

    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    //file has been uploaded to the cloudinary
    console.log("file uploaded to cloudinary", response.url);
    fs.unlinkSync(localfilepath);
    return response;
  } catch (error) {
    //file has not been uploaded to the cloudinary so remove the file from the local storage
    fs.unlinkSync(localfilepath);
    console.log("error in uploading file to cloudinary", error);
    return null;
  }
};

export { uploadoncloudinary };