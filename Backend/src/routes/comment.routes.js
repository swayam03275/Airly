import { Router } from "express";
import {
  createComment,
  deleteComment,
  editComment,
  getCommentCount,
  getCommentsByTweet,
  likeComment,
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication per-route to avoid affecting unrelated routers mounted at the same prefix
router.post("/tweets/:tweetId/comments", verifyJWT, createComment);
router.get("/tweets/:tweetId/comments", verifyJWT, getCommentsByTweet);
router.get("/tweets/:tweetId/comments/count", verifyJWT, getCommentCount);
router.patch("/comments/:commentId", verifyJWT, editComment);
router.delete("/comments/:commentId", verifyJWT, deleteComment);
router.post("/comments/:commentId/like", verifyJWT, likeComment);

export default router;
