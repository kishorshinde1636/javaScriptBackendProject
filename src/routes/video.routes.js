import { upload } from "../middlewares/multer.middleware.js";
import router from "./user.routes.js";
import { verifyJwt } from "./../middlewares/auth.middleware.js";
import {
  publishAVideo,
  getVideoById,
  deleteVideo,
  updateTitleAndDescription,
  updateThumbNail,
  togglePublishStatus,
} from "../controllers/video.controller.js";

router.route("/upload").post(
  verifyJwt,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbNail", maxCount: 1 },
  ]),
  publishAVideo
);

router.route("/:videoId").get(verifyJwt, getVideoById);
router.route("/:videoId").delete(verifyJwt, deleteVideo);
router.route("/:videoId").put(verifyJwt, updateTitleAndDescription);
router.route("/:videoId").put(verifyJwt, updateThumbNail);
router.route("/publish/:videoId").patch(togglePublishStatus);
export default router;
