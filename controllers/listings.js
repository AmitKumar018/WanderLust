const Listing=require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN
const geocodingClient=mbxGeocoding({accessToken: mapToken});
// Index route
module.exports.index=async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

// New Route
module.exports.renderNewForm=(req, res) => {
  res.render("listings/new.ejs");
};

// show route
module.exports.showListing=async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
  .populate({path:"reviews", 
    populate:{
      path:"author",
  },
})
  .populate("owner");

  if(!listing){
    req.flash("error", "listing doesn't exist");
    res.redirect("/listings");
  }
  // console.log(listing);
  res.render("listings/show.ejs", { listing });

};

// create

module.exports.createListing=async (req, res,next) => {

  // these are all for map feature
  let response=await geocodingClient.forwardGeocode({
    query:req.body.listing.location,
    limit:1
  }).send()
 
  
// till here
  if(!req.body.listing){
    throw new ExpressError(400,"send valid data for listing");
  }
  const listingData = req.body.listing;
  console.log("Incoming listing data:", listingData);
  if (typeof listingData.image === "string") {
    listingData.image = {
      url: listingData.image.trim() || "https://via.placeholder.com/800x600",
      filename: "listingimage"
    };
  }
  let url=req.file.path;
  let filename=req.file.filename;
  const newListing = new Listing(listingData);
  newListing.owner=req.user._id;
  newListing.image={url, filename};

  newListing.geometry=response.body.features[0].geometry;
  
  let savedListing=await newListing.save();
  console.log(savedListing) 
  req.flash("success", "New Listing Created Successfully!")
  res.redirect("/listings");
};

// edit

module.exports.renderEditForm=async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing){
    req.flash("error", "listing you requested for does not exist");
    res.redirect("/listings");
  }

  // let originalImageUrl=listing.image.url;
  // originalImageUrl=originalImageUrl.replace("/upload", "/upload/h_300,w_250")
  res.render("listings/edit.ejs", { listing});
}

// Update
module.exports.updateListing=async (req, res) => {
  let { id } = req.params;
  let updateData = req.body.listing;
  const existingListing = await Listing.findById(id);

  // If the image input is empty or only whitespace, retain the existing image object.
  // Otherwise, update only the URL while preserving the filename.
  if (!updateData.image || updateData.image.trim() === "") {
    updateData.image = existingListing.image;
  } else {
    updateData.image = {
      ...existingListing.image,
      url: updateData.image.trim(),
    };
  }
  
  let listing=await Listing.findByIdAndUpdate(id, updateData);
  if(typeof req.file  != "undefined"){
    let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
  }
  req.flash("success", "Updated Successfully!")
  res.redirect(`/listings/${id}`);
}

// delete

module.exports.destroyListings=async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", " Listing Deleted Successfully!")
  res.redirect("/listings");
};
// searching
