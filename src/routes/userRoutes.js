import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutuser,
  refresaccesshtoken,
  changecurrentpassword,
  getCurrentuser,
  updateAccountDetails,
  updateavatar,
  updatecoverimage,
  getUserchannelProfile,
  getuserwatchhistory,
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

//routes for updating user details

router.route("/change-password").post(verifyJWT, changecurrentpassword);

router.route("/current-user").get(verifyJWT, getCurrentuser);

router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateavatar);

router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updatecoverimage);

router
  .route("/channel-profile/:username")
  .get(verifyJWT, getUserchannelProfile);

router.route("/watch-history").get(verifyJWT, getuserwatchhistory);

export default router;
