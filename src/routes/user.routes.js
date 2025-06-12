import express from "express";
import {
  deleteUser,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
  uploadProfilePicture,
} from "../controllers/user.controller.js";

import { isLoggedIn } from "../middleware/isLoggedIn.js";

import upload from "../middleware/fileUpload.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from the user router!");
});

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/logout", logoutUser);

router.patch("/update", isLoggedIn, updateUser);

router.get("/profile", isLoggedIn, getUser);

router.delete("/delete", isLoggedIn, deleteUser);

router.post(
  "/upload-profile-picture",
  isLoggedIn,
  upload.single("profilePicture"),
  uploadProfilePicture
);

export default router;
