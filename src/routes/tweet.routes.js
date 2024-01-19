import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import {
  createTweet,
  getUserTweet,
  deleteTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJwt);
router.route("/create/tweet").post(upload.none(), createTweet);
router.route("/getTweet").get(getUserTweet);
router.route("/deleteTweet/:tweetId").delete(deleteTweet);
router.route("/updateTweet/:tweetId").put(updateTweet);

export default router;
