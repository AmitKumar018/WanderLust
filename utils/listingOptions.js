const categories = [
  { value: "trending", label: "Trending", icon: "fa-fire" },
  { value: "rooms", label: "Rooms", icon: "fa-bed" },
  { value: "iconic-cities", label: "Iconic cities", icon: "fa-mountain-city" },
  { value: "mountains", label: "Mountains", icon: "fa-mountain" },
  { value: "castles", label: "Castles", icon: "fa-fort-awesome" },
  { value: "pools", label: "Amazing pools", icon: "fa-person-swimming" },
  { value: "camping", label: "Camping", icon: "fa-campground" },
  { value: "farms", label: "Farms", icon: "fa-wheat-awn" },
  { value: "arctic", label: "Arctic", icon: "fa-snowman" },
  { value: "domes", label: "Domes", icon: "fa-igloo" },
  { value: "boats", label: "Boats", icon: "fa-sailboat" },
];

const amenities = [
  "Wifi",
  "Kitchen",
  "Air conditioning",
  "Free parking",
  "Pool",
  "Workspace",
  "Pet friendly",
  "Self check-in",
];

const categoryValues = categories.map((category) => category.value);

module.exports = {
  categories,
  amenities,
  categoryValues,
};
