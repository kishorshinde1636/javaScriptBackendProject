import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "./../models/video.model.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";

const publishAVideo = asyncHandler(async (req, res) => {
  // get the path of video and thumbnail from a form
  // check path empty or not
  // upload video and thumbnail on cloudinary
  // get the both url from cloudinary
  // store these URLs into DB
  // remove both files from local server
  // return responce to the user
  let localVideoPath;
  let localThumbnailPath;

  try {
    const { title, description } = req.body;
    console.log("description", description);

    if (!title || !description) {
      throw new ApiError(400, "title and descriptions are required");
    }

    if (
      req.files &&
      Array.isArray(req.files.videoFile) &&
      req.files.videoFile.length > 0
    ) {
      localVideoPath = req.files?.videoFile[0].path;
    }
    console.log(localVideoPath);

    if (
      req.files &&
      Array.isArray(req.files.thumbNail) &&
      req.files.thumbNail.length > 0
    ) {
      localThumbnailPath = req.files?.thumbNail[0].path;
    }

    console.log(localThumbnailPath);
    if (!localThumbnailPath || !localVideoPath) {
      404, "thumbnail and video are mandatory to upload!";
    }

    const cloudinaryVideoUrl = await uploadOnCloudinary(localVideoPath);

    const cloudinaryThumbnailUrl = await uploadOnCloudinary(localThumbnailPath);

    console.log("clod url", cloudinaryVideoUrl);
    console.log("thmb url", cloudinaryThumbnailUrl);

    if (!cloudinaryVideoUrl) {
      throw new ApiError(
        500,
        "Error while uploading the video on cloudinary, please try again"
      );
    }
    if (!cloudinaryThumbnailUrl) {
      throw new ApiError(
        500,
        "Error while uploading the Thumbnail on cloudinary, please try again"
      );
    }

    const duration =
      typeof cloudinaryVideoUrl.duration === "string"
        ? parseFloat(cloudinaryVideoUrl.duration)
        : cloudinaryVideoUrl.duration;

    console.log("duration", duration);
    const VideoPublicId = cloudinaryVideoUrl?.public_id;
    const ThumbNailPublicId = cloudinaryThumbnailUrl?.public_id;

    console.log("video public id", VideoPublicId);

    const userId = req.user?._id;
    console.log("user Id", userId);
    const newVideo = await Video.create({
      videoFile: cloudinaryVideoUrl.url,
      thumbnail: cloudinaryThumbnailUrl.url,
      VideoPublicId,
      ThumbNailPublicId,
      owner: new mongoose.Types.ObjectId(userId),
      title,
      description,
      duration: duration,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, newVideo, "Video Uploaded Successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "internal server error upload video"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "Invalid Video Id");
  }

  if (!userId) {
    throw new ApiError(401, "User is not authorized or login");
  }
  console.log("User Id", userId);

  try {
    const userVideo = await Video.findByIdAndUpdate(
      { _id: videoId },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!userId) {
      throw new ApiError(404, "Video Not Found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, userVideo, "videos fetched successfully"));
  } catch (error) {
    error.statusCode || 500,
      error.message || "internal server error in get user videos";
  }
  res.send(videoId);
});

const deleteVideo = asyncHandler(async (req, res) => {
  // get user Id
  // get video id which needs to be delete
  // get all user docs from video collection
  // find and delete the video/doc from user collection
  // return response updated collection
  const { videoId } = req.params;
  const userId = req.user._id;

  console.log("user Id", userId);

  if (!userId) {
    throw new ApiError(404, "user not found");
  }
  console.log("video Id", videoId);

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "Video id is invalid");
  }

  try {
    const userVideo = await Video.findOne({ _id: videoId, owner: userId });

    if (!userVideo) {
      throw new ApiError(404, "video Not Found or Unauthorized");
    }

    const { deleteVideoResponse, deleteImageResponse } =
      await deleteFromCloudinary([
        userVideo.public_id,
        userVideo.ThumbNailPublicId,
      ]);
    if (!deleteVideoResponse || !deleteImageResponse) {
      throw new ApiError(
        500,
        "Problem while deleting file from cloudinary, please try again"
      );
    }

    await Video.deleteOne({ _id: videoId, owner: userId });

    const UserAllVideo = await Video.find({ owner: userId });

    return res
      .status(200)
      .json(new ApiResponse(200, UserAllVideo, "Video deleted Successfully"));
  } catch (error) {
    error.statusCode || 500, error?.message || "internal server error";
  }
});

const updateTitleAndDescription = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);

  const { title, description } = req.body;

  console.log("Title " + title);
  console.log("Description " + description);

  if (!title || !description) {
    throw new ApiError(404, "title and descriptions are mandatory fields");
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "video you are tying to update is not available!!");
  }

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(404, "user not found");
  }

  try {
    const updatedTitleAndDescription = await Video.findByIdAndUpdate(
      {
        _id: videoId,
        userId: userId,
      },
      {
        $set: {
          title,
          description,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedTitleAndDescription) {
      throw new ApiError(
        404,
        "Something went wrong while updating video details Plz Try Again"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedTitleAndDescription,
          "Video details updated successfully."
        )
      );
  } catch (error) {
    console.error("Error updating video:", error);

    const statusCode = error.statusCode || 500;
    const errorMessage =
      error.message || "Something went wrong while updating video details!";

    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, null, errorMessage));
  }
});

const updateThumbNail = asyncHandler(async (req, res) => {
  try {
    if (
      !req.files ||
      !req.files.buffer ||
      Object.keys(req.files).length === 0
    ) {
      throw new ApiError(404, "Please select a thumbnail picture");
    }

    const localPathThumbNail = req.files?.path;

    console.log("Local Path Thumbnails", localPathThumbNail);
    if (!localPathThumbNail) {
      throw new ApiError(400, "error in local path of thumbnail");
    }

    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(404, "Video Id is not valid");
    }

    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError("Unauthorized User");
    }

    const result = await Video.findOne({ _id: videoId, owner: userId });

    if (!result || !result.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            result,
            "Video does not exist or unauthorized user"
          )
        );
    }

    const { deleteImageResponse } = await deleteFromCloudinary([
      result.ThumbNailPublicId,
    ]);

    if (!deleteImageResponse) {
      throw new ApiError(
        "500",
        "Problem while deleting file from cloudinary, please try again"
      );
    }

    const cloudniaryThumbNailUpdate =
      await uploadOnCloudinary(localPathThumbNail);

    if (!cloudniaryThumbNailUpdate) {
      throw new ApiError(
        500,
        "Error while updating the Thumbnail on cloudinary"
      );
    }

    const updateVideoObj = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          thumbNail: cloudniaryThumbNailUpdate.url,
          ThumbNailPublicId: cloudniaryThumbNailUpdate.public_id,
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updateVideoObj, "ThumbNail successfully updated")
      );
  } catch (error) {
    console.log("Error while updating thumbnails");

    const statusCode = error.statusCode || 500;
    const errorMessage =
      error.message ||
      "Something went wrong while updating thumbnails details!";

    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, null, errorMessage));
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Does Not Exits");
  }

  const userId = req.user?._id;
  const ownerId = video.ownerId;
  if (userId.toString() !== ownerId.toString()) {
    throw new ApiError("Unauthorized User");
  }

  const isPublished = !video.isPublished;

  const updatedStatus = await Video.findByIdAndUpdate(videoId, {
    $set: { isPublished },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, updatedStatus, "Video  updated successfully."));
});
export {
  publishAVideo,
  getVideoById,
  deleteVideo,
  updateTitleAndDescription,
  updateThumbNail,
  togglePublishStatus,
};
