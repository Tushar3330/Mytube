import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutuser,
} from "../controllers/userController.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "./../middlewares/auth";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutuser);

export default router;
