const Listing = require("../models/listing");
const User = require("../models/user");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { cloudinary } = require("../cloudConfig");
const ExpressError = require("../utils/ExpressError");
const { categoryValues, amenities } = require("../utils/listingOptions");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mapToken ? mbxGeocoding({ accessToken: mapToken }) : null;
const fallbackGeometry = { type: "Point", coordinates: [77.209, 28.6139] };
const sortOptions = {
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  newest: { createdAt: -1 },
  rating: { averageRating: -1, reviewCount: -1 },
};

function numberFromQuery(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeListingData(listing) {
  return {
    ...listing,
    price: Number(listing.price),
    bedrooms: Number(listing.bedrooms),
    bathrooms: Number(listing.bathrooms),
    amenities: normalizeArray(listing.amenities).filter((amenity) =>
      amenities.includes(amenity)
    ),
    houseRules:
      listing.houseRules?.trim() || "Respect the home and the neighborhood.",
  };
}

async function getGeometry(listingData) {
  if (!geocodingClient) {
    return fallbackGeometry;
  }

  try {
    const response = await geocodingClient
      .forwardGeocode({
        query: `${listingData.location}, ${listingData.country}`,
        limit: 1,
      })
      .send();

    return response.body.features[0]?.geometry || fallbackGeometry;
  } catch (err) {
    console.warn("Geocoding failed:", err.message);
    return fallbackGeometry;
  }
}

function imagesFromFiles(files = []) {
  return files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));
}

function sameId(left, right) {
  return left && right && left.toString() === right.toString();
}

async function destroyImages(images = []) {
  const filenames = images.map((image) => image?.filename).filter(Boolean);

  await Promise.all(
    filenames
      .filter((filename) => filename !== "listingimage")
      .map((filename) => cloudinary.uploader.destroy(filename).catch(() => null))
  );
}

function buildListingFilter(query) {
  const filter = { isActive: { $ne: false } };
  const projection = {};
  const trimmedQuery = query.q?.trim();
  const minPrice = numberFromQuery(query.minPrice);
  const maxPrice = numberFromQuery(query.maxPrice);

  if (trimmedQuery) {
    filter.$text = { $search: trimmedQuery };
    projection.score = { $meta: "textScore" };
  }

  if (categoryValues.includes(query.category)) {
    filter.category = query.category;
  }

  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.price = {};
    if (Number.isFinite(minPrice)) {
      filter.price.$gte = minPrice;
    }
    if (Number.isFinite(maxPrice)) {
      filter.price.$lte = maxPrice;
    }
  }

  return { filter, projection };
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function currentQueryString(query) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    const currentValue = firstQueryValue(value);

    if (currentValue !== undefined) {
      params.set(key, currentValue);
    }
  });

  return params.toString();
}

function normalizedListingParams(query) {
  const params = new URLSearchParams();
  const q = firstQueryValue(query.q)?.trim();
  const category = firstQueryValue(query.category);
  const minPrice = numberFromQuery(firstQueryValue(query.minPrice));
  const maxPrice = numberFromQuery(firstQueryValue(query.maxPrice));
  const sort = firstQueryValue(query.sort);
  const page = parseInt(firstQueryValue(query.page), 10);

  if (q) {
    params.set("q", q);
  }

  if (categoryValues.includes(category)) {
    params.set("category", category);
  }

  if (Number.isFinite(minPrice)) {
    params.set("minPrice", String(minPrice));
  }

  if (Number.isFinite(maxPrice)) {
    params.set("maxPrice", String(maxPrice));
  }

  if (sortOptions[sort]) {
    params.set("sort", sort);
  }

  if (Number.isInteger(page) && page > 1) {
    params.set("page", String(page));
  }

  return params;
}

function buildSort(query) {
  if (sortOptions[query.sort]) {
    return sortOptions[query.sort];
  }

  if (query.q?.trim()) {
    return { score: { $meta: "textScore" }, isGuestFavorite: -1, averageRating: -1 };
  }

  return {
    isGuestFavorite: -1,
    averageRating: -1,
    reviewCount: -1,
    createdAt: -1,
  };
}

module.exports.index = async (req, res) => {
  const normalizedParams = normalizedListingParams(req.query);
  const normalizedQueryString = normalizedParams.toString();

  if (
    Object.keys(req.query).length &&
    currentQueryString(req.query) !== normalizedQueryString
  ) {
    return res.redirect(
      normalizedQueryString ? `/listings?${normalizedQueryString}` : "/listings"
    );
  }

  const requestedPage = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = 9;
  const { filter, projection } = buildListingFilter(req.query);
  const sort = buildSort(req.query);

  const totalListings = await Listing.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(totalListings / limit), 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * limit;
  const allListings = await Listing.find(filter, projection)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  res.render("listings/index.ejs", {
    allListings,
    currentPage,
    totalPages,
    totalListings,
    filters: {
      q: req.query.q || "",
      category: req.query.category || "",
      minPrice: req.query.minPrice || "",
      maxPrice: req.query.maxPrice || "",
      sort: req.query.sort || "recommended",
    },
  });
};

module.exports.redirectLegacySearch = (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    req.flash("error", "Search field cannot be empty.");
    return res.redirect("/listings");
  }

  res.redirect(`/listings?q=${encodeURIComponent(q)}`);
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs", {
    listing: {},
  });
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
        select: "username createdAt",
      },
    })
    .populate("owner", "username email isEmailVerified createdAt");

  if (!listing) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }

  const ownerId = listing.owner?._id || listing.owner;
  const isListingOwner = sameId(ownerId, req.user?._id);

  if (!ownerId) {
    req.flash("error", "Listing is temporarily unavailable.");
    return res.redirect("/listings");
  }

  if (listing.isActive === false && !isListingOwner) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }

  const reviewSort = req.query.reviewSort || "newest";
  const sortedReviews = [...listing.reviews].sort((a, b) => {
    if (reviewSort === "highest") {
      return b.rating - a.rating;
    }
    if (reviewSort === "lowest") {
      return a.rating - b.rating;
    }
    return b.createdAt - a.createdAt;
  });

  const isSaved = req.user
    ? req.user.savedListings.some((savedId) => savedId.equals(listing._id))
    : false;

  res.render("listings/show.ejs", {
    listing,
    sortedReviews,
    reviewSort,
    isSaved,
  });
};

module.exports.createListing = async (req, res) => {
  const listingData = normalizeListingData(req.body.listing);
  const images = imagesFromFiles(req.files);

  if (!images.length) {
    throw new ExpressError(400, "Please upload at least one listing image.");
  }

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;
  newListing.images = images;
  newListing.image = images[0];
  newListing.geometry = await getGeometry(listingData);

  await newListing.save();

  req.flash("success", "New listing created successfully.");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  const listing = res.locals.listing || (await Listing.findById(req.params.id));

  if (!listing) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const existingListing = res.locals.listing || (await Listing.findById(id));
  const updateData = normalizeListingData(req.body.listing);
  const locationChanged =
    existingListing.location !== updateData.location ||
    existingListing.country !== updateData.country;
  const images = imagesFromFiles(req.files);

  if (images.length) {
    await destroyImages(existingListing.images?.length ? existingListing.images : [existingListing.image]);
    updateData.images = images;
    updateData.image = images[0];
  }

  if (locationChanged) {
    updateData.geometry = await getGeometry(updateData);
  }

  await Listing.findByIdAndUpdate(id, updateData, {
    runValidators: true,
  });

  req.flash("success", "Listing updated successfully.");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListings = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndDelete(id);

  if (listing) {
    await destroyImages(listing.images?.length ? listing.images : [listing.image]);
  }

  req.flash("success", "Listing deleted successfully.");
  res.redirect("/listings");
};

module.exports.toggleListingStatus = async (req, res) => {
  const listing = res.locals.listing;
  listing.isActive = !listing.isActive;
  await listing.save();

  req.flash(
    "success",
    listing.isActive ? "Listing is now active." : "Listing is now inactive."
  );
  res.redirect("/dashboard");
};

module.exports.saveListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing || listing.isActive === false) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { savedListings: listing._id },
  });

  req.flash("success", "Saved to your wishlist.");
  res.redirect(req.get("referer") || `/listings/${listing._id}`);
};

module.exports.unsaveListing = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { savedListings: req.params.id },
  });

  req.flash("success", "Removed from your wishlist.");
  res.redirect(req.get("referer") || "/wishlists");
};
