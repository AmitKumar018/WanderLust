const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const MessageThread = require("../models/messageThread");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }

      req.flash("success", "Welcome to WanderLust.");
      res.redirect(req.session.redirectUrl || "/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back to WanderLust.");
  res.redirect(res.locals.redirectUrl || "/listings");
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.flash("success", "You are logged out.");
    res.redirect("/listings");
  });
};

module.exports.dashboard = async (req, res) => {
  const [myListings, hostBookings, guestBookings, hostThreads, guestThreads] =
    await Promise.all([
      Listing.find({ owner: req.user._id }).sort({ createdAt: -1 }),
      Booking.find({ host: req.user._id })
        .sort({ createdAt: -1 })
        .populate("listing guest"),
      Booking.find({ guest: req.user._id })
        .sort({ createdAt: -1 })
        .populate("listing host"),
      MessageThread.find({ host: req.user._id })
        .sort({ updatedAt: -1 })
        .populate("listing guest host"),
      MessageThread.find({ guest: req.user._id })
        .sort({ updatedAt: -1 })
        .populate("listing guest host"),
    ]);

  const approvedBookings = hostBookings.filter(
    (booking) => booking.status === "approved"
  );
  const estimatedEarnings = approvedBookings.reduce(
    (sum, booking) => sum + booking.totalPrice,
    0
  );

  res.render("users/dashboard.ejs", {
    myListings,
    hostBookings,
    guestBookings,
    hostThreads,
    guestThreads,
    estimatedEarnings,
  });
};

module.exports.wishlists = async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedListings");
  res.render("users/wishlists.ejs", {
    savedListings: user.savedListings || [],
  });
};

module.exports.bookings = async (req, res) => {
  const bookings = await Booking.find({
    $or: [{ guest: req.user._id }, { host: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .populate("listing guest host");

  res.render("users/bookings.ejs", { bookings });
};

module.exports.profile = async (req, res) => {
  const profileUser = await User.findById(req.params.id || req.user._id);

  if (!profileUser) {
    req.flash("error", "Profile does not exist.");
    return res.redirect("/listings");
  }

  const hostedListings = await Listing.find({
    owner: profileUser._id,
    isActive: true,
  }).sort({ averageRating: -1, createdAt: -1 });

  res.render("users/profile.ejs", {
    profileUser,
    hostedListings,
  });
};
