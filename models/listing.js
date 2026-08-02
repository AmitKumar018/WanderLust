const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");
const { categoryValues, amenities } = require("../utils/listingOptions");

const imageSchema = new Schema(
  {
    filename: String,
    url: String,
  },
  { _id: false }
);

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    image: imageSchema,
    images: {
      type: [imageSchema],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: categoryValues,
      default: "trending",
    },
    amenities: {
      type: [String],
      enum: amenities,
      default: [],
    },
    bedrooms: {
      type: Number,
      default: 1,
      min: 0,
      max: 30,
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: 0,
      max: 30,
    },
    houseRules: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: "Respect the home and the neighborhood.",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isGuestFavorite: {
      type: Boolean,
      default: false,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

listingSchema.index({
  title: "text",
  description: "text",
  location: "text",
  country: "text",
});
listingSchema.index({ isActive: 1, category: 1, price: 1 });
listingSchema.index({ owner: 1, createdAt: -1 });

listingSchema.methods.primaryImage = function primaryImage() {
  return this.images?.[0] || this.image || null;
};

listingSchema.post("findOneAndDelete", async (listing) => {
  if (!listing) {
    return;
  }

  const Booking = require("./booking");
  const MessageThread = require("./messageThread");

  await Review.deleteMany({ _id: { $in: listing.reviews } });
  await Booking.deleteMany({ listing: listing._id });
  await MessageThread.deleteMany({ listing: listing._id });
});

module.exports = mongoose.model("Listing", listingSchema);
