const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  changeUserPassword,
  userPasswordReset,
  sendUserPasswordResetEmail,
} = require("../controllers/userController");

const validateToken = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);
router.post("/email-verify", sendUserPasswordResetEmail);
router.post("/reset-password/:id/:token", userPasswordReset);

router.post("/change-password", validateToken, changeUserPassword);
router.get("/current", validateToken, currentUser);

module.exports = router;
