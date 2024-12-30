import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // Refers to the subscribing user
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, // Refers to the user being subscribed to
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;

