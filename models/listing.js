const mongoose = require("mongoose");
const Schema=mongoose.Schema;
const Review=require("./review.js");
const imageSchema = new mongoose.Schema({
  filename: String,
  url: String,
});

const listingSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: imageSchema, // image is an object with a filename and a URL
  price: Number,
  location: String,
  country: String,
  reviews:[{
      type: mongoose.Schema.Types.ObjectId,
      ref:"Review",
  }],

  owner:{
    type: Schema.Types.ObjectId,
    ref:"user",
  },

  // for map functionality
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

listingSchema.post("findOneAndDelete", async(listing)=>{
  if(listing){
  await Review.deleteMany({_id : {$in: listing.reviews}})
}
});
module.exports = mongoose.model("Listing", listingSchema);