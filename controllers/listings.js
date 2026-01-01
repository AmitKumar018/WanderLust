const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const ExpressError = require("../utils/ExpressError");

//  PAGINATION APPLIED HERE 
module.exports.index = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = 6;  // listings per page
  let skip = (page - 1) * limit;

  const totalListings = await Listing.countDocuments({});
  const totalPages = Math.ceil(totalListings / limit);

  const allListings = await Listing.find({})
    .skip(skip)
    .limit(limit);

  res.render("listings/index.ejs", { 
    allListings,
    currentPage: page,
    totalPages 
  });
};



// New Route
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// show route
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "listing doesn't exist");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// create
module.exports.createListing = async (req, res, next) => {

  let response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
  }).send();

  if (!req.body.listing) {
    throw new ExpressError(400, "send valid data for listing");
  }

  const listingData = req.body.listing;
  
  if (typeof listingData.image === "string") {
    listingData.image = {
      url: listingData.image.trim() || "https://via.placeholder.com/800x600",
      filename: "listingimage"
    };
  }

  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  newListing.geometry = response.body.features[0].geometry;

  let savedListing = await newListing.save();

  req.flash("success", "New Listing Created Successfully!");
  res.redirect("/listings");
};

// edit
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "listing you requested for does not exist");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

// Update
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let updateData = req.body.listing;
  const existingListing = await Listing.findById(id);

  if (!updateData.image || updateData.image.trim() === "") {
    updateData.image = existingListing.image;
  } else {
    updateData.image = {
      ...existingListing.image,
      url: updateData.image.trim(),
    };
  }

  let listing = await Listing.findByIdAndUpdate(id, updateData);

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Updated Successfully!");
  res.redirect(`/listings/${id}`);
};

// delete
module.exports.destroyListings = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted Successfully!");
  res.redirect("/listings");
};
