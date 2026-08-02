const Joi = require("joi");
const { categoryValues, amenities } = require("./utils/listingOptions");

const checkboxArray = Joi.alternatives()
  .try(Joi.array().items(Joi.string().valid(...amenities)), Joi.string().valid(...amenities))
  .default([]);

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().max(120).required(),
    description: Joi.string().trim().max(2000).required(),
    location: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    price: Joi.number().min(0).required(),
    category: Joi.string()
      .valid(...categoryValues)
      .required(),
    amenities: checkboxArray,
    bedrooms: Joi.number().integer().min(0).max(30).required(),
    bathrooms: Joi.number().integer().min(0).max(30).required(),
    houseRules: Joi.string().trim().max(1200).allow("", null),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().trim().max(1200).required(),
  }).required(),
});

module.exports.bookingSchema = Joi.object({
  booking: Joi.object({
    checkIn: Joi.date().iso().required(),
    checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required(),
  }).required(),
});

module.exports.messageSchema = Joi.object({
  message: Joi.object({
    body: Joi.string().trim().min(2).max(1200).required(),
  }).required(),
});

module.exports.reportSchema = Joi.object({
  report: Joi.object({
    targetType: Joi.string().valid("listing", "review").required(),
    targetId: Joi.string().hex().length(24).required(),
    reason: Joi.string().trim().min(3).max(400).required(),
  }).required(),
});
