import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
   
    videoFile: {
      type: String,
      required: true, // URL or file path for the video
    },
    thumbnail: {
      type: String, // URL or file path for the thumbnail image
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
     
    },
    duration: {
      type: Number, // Duration in seconds
      required: true,
     
    },
    views: {
      type: Number,
      default: 0,
    
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Assuming "User" is the model name for users
        required: true,
      },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);  
// Add a plugin to the schema to enable pagination with aggregate
videoSchema.plugin(mongooseAggregatePaginate);




const Video = mongoose.model("Video", videoSchema);

export default Video;
