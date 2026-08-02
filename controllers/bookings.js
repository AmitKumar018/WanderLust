const Booking = require("../models/booking");
const Listing = require("../models/listing");

function calculateNights(checkIn, checkOut) {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

async function hasApprovedOverlap(listingId, checkIn, checkOut, excludedBookingId) {
  const query = {
    listing: listingId,
    status: "approved",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  if (excludedBookingId) {
    query._id = { $ne: excludedBookingId };
  }

  return Booking.exists(query);
}

module.exports.createBooking = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing || !listing.isActive) {
    req.flash("error", "Listing is not available.");
    return res.redirect("/listings");
  }

  if (!listing.owner) {
    req.flash("error", "Listing is temporarily unavailable.");
    return res.redirect("/listings");
  }

  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot request your own listing.");
    return res.redirect(`/listings/${listing._id}`);
  }

  const checkIn = new Date(req.body.booking.checkIn);
  const checkOut = new Date(req.body.booking.checkOut);
  const nights = calculateNights(checkIn, checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    req.flash("error", "Check-in date cannot be in the past.");
    return res.redirect(`/listings/${listing._id}`);
  }

  if (await hasApprovedOverlap(listing._id, checkIn, checkOut)) {
    req.flash("error", "Those dates are already booked.");
    return res.redirect(`/listings/${listing._id}`);
  }

  await Booking.create({
    listing: listing._id,
    guest: req.user._id,
    host: listing.owner,
    checkIn,
    checkOut,
    totalPrice: nights * listing.price,
  });

  req.flash("success", "Booking request sent to the host.");
  res.redirect("/bookings");
};

module.exports.approveBooking = async (req, res) => {
  const booking = res.locals.booking;

  if (booking.status !== "pending") {
    req.flash("error", "Only pending bookings can be approved.");
    return res.redirect("/dashboard");
  }

  if (
    await hasApprovedOverlap(
      booking.listing,
      booking.checkIn,
      booking.checkOut,
      booking._id
    )
  ) {
    req.flash("error", "Another approved booking already overlaps those dates.");
    return res.redirect("/dashboard");
  }

  booking.status = "approved";
  await booking.save();

  req.flash("success", "Booking approved.");
  res.redirect("/dashboard");
};

module.exports.rejectBooking = async (req, res) => {
  const booking = res.locals.booking;

  if (booking.status !== "pending") {
    req.flash("error", "Only pending bookings can be rejected.");
    return res.redirect("/dashboard");
  }

  booking.status = "rejected";
  await booking.save();

  req.flash("success", "Booking rejected.");
  res.redirect("/dashboard");
};

module.exports.cancelBooking = async (req, res) => {
  const booking = res.locals.booking;
  booking.status = "cancelled";
  await booking.save();

  req.flash("success", "Booking cancelled.");
  res.redirect("/bookings");
};
