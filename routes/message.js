const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const {
  isLoggedIn,
  validateMessage,
  canAccessThread,
} = require("../middleware");
const messageController = require("../controllers/messages");

router.post(
  "/:id/reply",
  isLoggedIn,
  canAccessThread,
  validateMessage,
  wrapAsync(messageController.reply)
);

module.exports = router;
