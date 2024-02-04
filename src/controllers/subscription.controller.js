import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  try {
    const existingSubscription = await subscription.findOne({
      channel: channelId,
      subscriber: req.user._id,
    });

    if (existingSubscription) {
      await existingSubscription.deleteOne;

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            existingSubscription,
            "Unsubscribed successfully"
          )
        );
    } else {
      const newSubscription = await subscription.create({
        channel: channelId,
        subscriber: req.user._id,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
    }
  } catch (error) {
    throw new ApiError(
      500,
      `Error while toggling subscription: ${error.message}`
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const subscribers = await subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: "$subscriber._id",
        userName: "$subscriber.userName",
        avatar: "$subscriber.avatar",
        fullName: "$subscriber.fullName",
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $count: "totalSubscribers",
    },
  ]);

  if (!subscribers) {
    throw new ApiError(
      400,
      "Some went wrong while fetching subscribed channel"
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const subscribedChannels = await subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $project: {
        _id: "$channel._id",
        userName: "$channel.userName",
        avatar: "$channel.avatar",
        fullName: "$channel.fullName",
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $count: "totalSubscribedChannels",
    },
  ]);

  if (!subscribedChannels) {
    throw new ApiError(
      400,
      "Some went wrong while fetching subscribed channel"
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully"
      )
    );
});
export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
