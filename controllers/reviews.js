const Review = require("../models/review");
const Listing = require("../models/listing");
const { refreshListingStats } = require("../utils/listingStats");

module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }

  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;

  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  await refreshListingStats(listing._id);

  req.flash("success", "Review added successfully.");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  await refreshListingStats(id);

  req.flash("success", "Review deleted successfully.");
  res.redirect(`/listings/${id}`);
};
