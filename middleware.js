const Listing = require("./models/listing");
const Review = require("./models/review");
const Booking = require("./models/booking");
const MessageThread = require("./models/messageThread");
const ExpressError = require("./utils/ExpressError");
const {
  listingSchema,
  reviewSchema,
  bookingSchema,
  messageSchema,
  reportSchema,
} = require("./schema");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "Please log in to continue.");
    return res.redirect("/login");
  }

  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
    delete req.session.redirectUrl;
  }

  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }

  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not the owner of this listing.");
    return res.redirect(`/listings/${id}`);
  }

  res.locals.listing = listing;
  next();
};

module.exports.validateListing = (req, res, next) => {
  const { error, value } = listingSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errmsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errmsg);
  }

  req.body = value;
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error, value } = reviewSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errmsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errmsg);
  }

  req.body = value;
  next();
};

module.exports.validateBooking = (req, res, next) => {
  const { error, value } = bookingSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errmsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errmsg);
  }

  req.body = value;
  next();
};

module.exports.validateMessage = (req, res, next) => {
  const { error, value } = messageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errmsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errmsg);
  }

  req.body = value;
  next();
};

module.exports.validateReport = (req, res, next) => {
  const { error, value } = reportSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errmsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errmsg);
  }

  req.body = value;
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review does not exist.");
    return res.redirect(`/listings/${id}`);
  }

  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not the author of this review.");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

module.exports.isBookingHost = async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    req.flash("error", "Booking request does not exist.");
    return res.redirect("/dashboard");
  }

  if (!booking.host.equals(req.user._id)) {
    req.flash("error", "You cannot manage this booking.");
    return res.redirect("/dashboard");
  }

  res.locals.booking = booking;
  next();
};

module.exports.isBookingParticipant = async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    req.flash("error", "Booking does not exist.");
    return res.redirect("/bookings");
  }

  if (!booking.guest.equals(req.user._id) && !booking.host.equals(req.user._id)) {
    req.flash("error", "You cannot access this booking.");
    return res.redirect("/bookings");
  }

  res.locals.booking = booking;
  next();
};

module.exports.canAccessThread = async (req, res, next) => {
  const thread = await MessageThread.findById(req.params.id);

  if (!thread) {
    req.flash("error", "Message thread does not exist.");
    return res.redirect("/dashboard");
  }

  if (!thread.guest.equals(req.user._id) && !thread.host.equals(req.user._id)) {
    req.flash("error", "You cannot access this message thread.");
    return res.redirect("/dashboard");
  }

  res.locals.thread = thread;
  next();
};
