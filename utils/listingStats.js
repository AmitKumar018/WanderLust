const Listing = require("../models/listing");
const Review = require("../models/review");

async function refreshListingStats(listingId) {
  const reviews = await Review.find({ _id: { $in: await getReviewIds(listingId) } });
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  await Listing.findByIdAndUpdate(listingId, {
    reviewCount,
    averageRating: Number(averageRating.toFixed(2)),
    isGuestFavorite: reviewCount >= 3 && averageRating >= 4.5,
  });
}

async function getReviewIds(listingId) {
  const listing = await Listing.findById(listingId).select("reviews");
  return listing?.reviews || [];
}

module.exports = {
  refreshListingStats,
};
