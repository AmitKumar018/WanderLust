require("dotenv").config();
const mongoose = require("mongoose");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = process.env.ATLASDB_URL;
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mapToken
  ? mbxGeocoding({ accessToken: mapToken })
  : null;

const fallbackGeometry = {
  type: "Point",
  coordinates: [77.209, 28.6139],
};

function inferCategory(listing) {
  const text = `${listing.title} ${listing.description}`.toLowerCase();

  if (text.includes("castle")) return "castles";
  if (text.includes("pool") || text.includes("villa")) return "pools";
  if (text.includes("mountain") || text.includes("ski") || text.includes("chalet")) return "mountains";
  if (text.includes("cabin") || text.includes("camping") || text.includes("lake")) return "camping";
  if (text.includes("farm") || text.includes("treehouse") || text.includes("eco")) return "farms";
  if (text.includes("arctic") || text.includes("snow")) return "arctic";
  if (text.includes("dome")) return "domes";
  if (text.includes("boat") || text.includes("island") || text.includes("canal")) return "boats";
  if (text.includes("city") || text.includes("downtown") || text.includes("apartment")) return "iconic-cities";
  if (text.includes("room")) return "rooms";

  return "trending";
}

function inferAmenities(listing) {
  const text = `${listing.title} ${listing.description}`.toLowerCase();
  const amenities = ["Wifi", "Kitchen"];

  if (text.includes("pool") || text.includes("villa")) amenities.push("Pool");
  if (text.includes("beach") || text.includes("lake") || text.includes("cabin")) amenities.push("Free parking");
  if (text.includes("city") || text.includes("apartment") || text.includes("loft")) amenities.push("Workspace");
  if (text.includes("cottage") || text.includes("cabin")) amenities.push("Pet friendly");
  if (text.includes("luxury") || text.includes("modern")) amenities.push("Air conditioning");

  return [...new Set(amenities)];
}

function enrichListing(listing) {
  const highPrice = listing.price >= 3000;

  return {
    ...listing,
    images: listing.image ? [listing.image] : [],
    category: listing.category || inferCategory(listing),
    amenities: listing.amenities || inferAmenities(listing),
    bedrooms: listing.bedrooms || (highPrice ? 3 : 2),
    bathrooms: listing.bathrooms || (highPrice ? 2 : 1),
    houseRules:
      listing.houseRules ||
      "No parties. Respect quiet hours and leave the space tidy.",
    isActive: true,
  };
}

async function connectDB() {
  if (!MONGO_URL) {
    throw new Error("ATLASDB_URL must be set in .env");
  }

  await mongoose.connect(MONGO_URL);
  console.log("connected to db");
}

async function getSeedOwner() {
  const existingUser = await User.findOne({});

  if (existingUser) {
    return existingUser;
  }

  return User.create({
    username: "seed-owner",
    email: "seed-owner@example.com",
  });
}

async function getGeometry(listing) {
  if (!geocodingClient) {
    return fallbackGeometry;
  }

  try {
    const response = await geocodingClient
      .forwardGeocode({
        query: `${listing.location}, ${listing.country}`,
        limit: 1,
      })
      .send();

    return response.body.features[0]?.geometry || fallbackGeometry;
  } catch (err) {
    console.warn(`Using fallback coordinates for ${listing.title}:`, err.message);
    return fallbackGeometry;
  }
}

async function buildListingData(ownerId) {
  const listings = [];

  for (const rawListing of initData.data) {
    const listing = enrichListing(rawListing);

    listings.push({
      ...listing,
      owner: ownerId,
      geometry: await getGeometry(listing),
    });
  }

  return listings;
}

async function seedDB() {
  await connectDB();

  const owner = await getSeedOwner();
  const listings = await buildListingData(owner._id);

  for (const listing of listings) {
    await Listing.findOneAndUpdate(
      {
        title: listing.title,
        location: listing.location,
        country: listing.country,
      },
      { $set: listing },
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  console.log(`${listings.length} listings were seeded`);
}

seedDB()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
