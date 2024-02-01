import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.length < 2 || content.length > 255) {
    throw new ApiError(400, "Tweet must be between 2 and 255 characters.");
  }

  const userId = req.user?._id;
  console.log(userId);

  if (!userId) {
    throw new ApiError(401, "Unauthorized, please login");
  }

  try {
    const newTweet = await Tweet.create({
      content,
      owner: req.user?._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newTweet, "Tweet Created successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error while creating a tweet"
    );
  }
});

const getUserTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  console.log(userId);

  if (!userId) {
    throw new ApiError(401, "Unauthorized, please login");
  }

  try {
    const userTweet = await Tweet.find({ owner: userId });

    if (!userTweet) {
      return res
        .status(200)
        .json(new ApiResponse(400, userTweet || [], "user Tweets not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, userTweet, "User tweets fetched successfully")
      );
  } catch (error) {
    error.statusCode || 500,
      error.message || "Internal server error while fetching user tweets";
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  console.log(tweetId);

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized, please login");
  }
  console.log("user Id ", userId);

  try {
    const deleteTweet = await Tweet.findByIdAndDelete({
      _id: tweetId,
      owner: userId,
    });

    if (!deleteTweet) {
      throw new ApiError(404, "Tweet Not Found Or unauthorized to delete.");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deleteTweet, "Tweet deleted successfully"));
  } catch (error) {
    error.statusCode || 500,
      error.message || "Internal server error while deleting a tweet";
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  console.log(tweetId);
  console.log(content);

  if (
    !mongoose.Types.ObjectId.isValid(tweetId) ||
    !content ||
    content.length < 2 ||
    content.length > 255
  ) {
    throw new ApiError(
      400,
      "Invalid tweet ID or Tweet must be between 2 and 255 characters."
    );
  }
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized, please login");
  }

  try {
    const updateTweet = await Tweet.findByIdAndUpdate(
      { _id: tweetId },
      { $set: { content: content } },
      { new: true }
    );

    if (!updateTweet) {
      throw new ApiError(404, "Tweet Not Found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updateTweet, "Tweet updated successfully"));
  } catch (error) {
    error.statusCode || 500,
      error.message || "Internal server error while updating a tweet";
  }
});
export { createTweet, getUserTweet, deleteTweet, updateTweet };
