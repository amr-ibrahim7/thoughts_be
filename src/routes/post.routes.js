import upload from "../middleware/fileUpload.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";

import {
  addComment,
  allPost,
  createPost,
  deleteComment,
  deletePost,
  postByAuthor,
  postByCategory,
  updatePost,
} from "../controllers/post.controller.js";

import express from "express";
const router = express.Router();

router.get("/", allPost);

router.post("/create", isLoggedIn, upload.single("thumbnail"), createPost);

router.patch("/update", isLoggedIn, upload.single("thumbnail"), updatePost);

router.delete("/delete", isLoggedIn, deletePost);

router.get("/category", postByCategory);

router.get("/author", postByAuthor);

router.post("/:postId/comments", isLoggedIn, addComment);
router.delete("/:postId/comments/:commentId", isLoggedIn, deleteComment);

export default router;
