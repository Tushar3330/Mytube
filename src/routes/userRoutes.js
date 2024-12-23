import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutuser,
  refresaccesshtoken
} from "../controllers/userController.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "./../middlewares/auth.js";

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

router.route("/refresh-token").post(refresaccesshtoken);

export default router;
