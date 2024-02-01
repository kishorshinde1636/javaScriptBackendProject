import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File Is Uploaded on cloudinary ", response.url);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error.message || error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId || publicId.length === 0) return "Public Id Is Not Provided";

    const deleteVideoResponse = await cloudinary.api.delete_resources(
      publicId,
      {
        type: "upload",
        resources_type: "video",
      }
    );

    const deleteImageResponse = await cloudinary.api.delete_resources({
      type: "upload",
      resources_type: "image",
    });

    return { deleteVideoResponse, deleteImageResponse };
  } catch (error) {
    console.log("Error while Deleting from cloudinary");
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
