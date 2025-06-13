const express= require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const {isLoggedIn,isOwner, validateListing}=require("../middleware.js");
const listingController=require("../controllers/listings.js");
const multer=require('multer');
const {storage}=require("../cloudConfig.js");
const upload=multer({storage})

// CLEAN WAY OF WRITING

// index and create(post) request:
router
.route("/")
.get( wrapAsync(listingController.index))
.post(
  isLoggedIn,
  upload.single('listing[image]'),
  validateListing,
  wrapAsync(listingController.createListing)
);

// NEW ROUTE
router.get("/new",isLoggedIn, listingController.renderNewForm);

// show route and Update route and delete route

router
.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn,
  isOwner,
  upload.single('listing[image]'),
  validateListing, 
  wrapAsync(listingController.updateListing)
)
.delete(isLoggedIn,
  isOwner, wrapAsync(listingController.destroyListings)
);
// EDIT ROUTE
router.get("/:id/edit",isLoggedIn,
  isOwner, wrapAsync(listingController.renderEditForm)
);

// search


module.exports=router;


// SHOW ROUTE
//router.get("/:id", wrapAsync(listingController.showListing));




// UPDATE ROUTE
// router.put("/:id",isLoggedIn,
//   isOwner,
//   validateListing, wrapAsync(listingController.updateListing));

// // DELETE ROUTE
// router.delete("/:id",
//   isLoggedIn,
//   isOwner, wrapAsync(listingController.destroyListings)
// );

