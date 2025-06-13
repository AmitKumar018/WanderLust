const Review=require("../models/review");
const Listing=require("../models/listing");


// create review route
module.exports.createReview=async (req, res) => {
  // console.log(req.params.id);
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  newReview.author=req.user._id;
//   console.log(newReview);
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  req.flash("success", "New Review Added Successfully!") 
  res.redirect(`/listings/${listing._id}`);
};

// deleteReview

module.exports.destroyReview=async(req,res)=>{
  let {id,reviewId}=req.params;
  await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review Deleted Successfully!")
  res.redirect(`/listings/${id}`);
};