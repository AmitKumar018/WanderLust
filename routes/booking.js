const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const {
  isLoggedIn,
  isBookingHost,
  isBookingParticipant,
} = require("../middleware");
const bookingController = require("../controllers/bookings");

router.patch(
  "/:id/approve",
  isLoggedIn,
  isBookingHost,
  wrapAsync(bookingController.approveBooking)
);

router.patch(
  "/:id/reject",
  isLoggedIn,
  isBookingHost,
  wrapAsync(bookingController.rejectBooking)
);

router.patch(
  "/:id/cancel",
  isLoggedIn,
  isBookingParticipant,
  wrapAsync(bookingController.cancelBooking)
);

module.exports = router;
