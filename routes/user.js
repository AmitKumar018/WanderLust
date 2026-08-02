const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { isLoggedIn, saveRedirectUrl } = require("../middleware");
const userController = require("../controllers/users");

router.get("/signup", userController.renderSignupForm);
router.post("/signup", wrapAsync(userController.signup));

router.get("/login", userController.renderLoginForm);
router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  userController.login
);

router.post("/logout", isLoggedIn, userController.logout);
router.get("/logout", (req, res) => {
  req.flash("error", "Please use the logout button.");
  res.redirect("/listings");
});

router.get("/dashboard", isLoggedIn, wrapAsync(userController.dashboard));
router.get("/wishlists", isLoggedIn, wrapAsync(userController.wishlists));
router.get("/bookings", isLoggedIn, wrapAsync(userController.bookings));
router.get("/profile", isLoggedIn, wrapAsync(userController.profile));
router.get("/users/:id", wrapAsync(userController.profile));

module.exports = router;
