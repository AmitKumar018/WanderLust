const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { storage } = require("../cloudConfig");
const multer = require("multer");
const ExpressError = require("../utils/ExpressError");
const {
  isLoggedIn,
  isOwner,
  validateListing,
  validateBooking,
  validateMessage,
} = require("../middleware");
const listingController = require("../controllers/listings");
const bookingController = require("../controllers/bookings");
const messageController = require("../controllers/messages");

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) {
      return cb(null, true);
    }

    cb(new ExpressError(400, "Only PNG, JPG, JPEG, or WEBP images are allowed."));
  },
});

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.array("listing[images]", 6),
    validateListing,
    wrapAsync(listingController.createListing)
  );

router.get("/new", isLoggedIn, listingController.renderNewForm);
router.get("/search/results", listingController.redirectLegacySearch);

router.post(
  "/:id/save",
  isLoggedIn,
  wrapAsync(listingController.saveListing)
);

router.delete(
  "/:id/save",
  isLoggedIn,
  wrapAsync(listingController.unsaveListing)
);

router.post(
  "/:id/bookings",
  isLoggedIn,
  validateBooking,
  wrapAsync(bookingController.createBooking)
);

router.post(
  "/:id/messages",
  isLoggedIn,
  validateMessage,
  wrapAsync(messageController.createThreadMessage)
);

router.patch(
  "/:id/status",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.toggleListingStatus)
);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.array("listing[images]", 6),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListings));

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
