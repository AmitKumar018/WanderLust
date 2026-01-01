const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const MONGO_URL = process.env.ATLASDB_URL;
main()
  .then(() => {
    console.log("conected to db");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "6837591ce118d6c8c4b05ca9",
  }));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};
initDB();
