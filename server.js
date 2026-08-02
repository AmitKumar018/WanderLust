if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const app = require("./app");

const port = process.env.PORT || 3000;
const dbUrl = process.env.ATLASDB_URL;

async function start() {
  await mongoose.connect(dbUrl);
  console.log("Connected to MongoDB");

  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Server failed to start:", err);
});
