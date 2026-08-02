const REQUIRED_FOR_SERVER = [
  "ATLASDB_URL",
  "SECRET",
  "CLOUD_NAME",
  "CLOUD_API_KEY",
  "CLOUD_API_SECRET",
  "MAP_TOKEN",
];

function getPort(value) {
  const port = Number.parseInt(value || "3000", 10);

  if (Number.isInteger(port) && port >= 0 && port <= 65535) {
    return port;
  }

  return 3000;
}

function getConfig() {
  return {
    env: process.env.NODE_ENV || "development",
    port: getPort(process.env.PORT),
    dbUrl: process.env.ATLASDB_URL,
    sessionSecret: process.env.SECRET,
    cloudName: process.env.CLOUD_NAME,
    cloudApiKey: process.env.CLOUD_API_KEY,
    cloudApiSecret: process.env.CLOUD_API_SECRET,
    mapToken: process.env.MAP_TOKEN,
  };
}

function assertEnv(requiredNames = REQUIRED_FOR_SERVER) {
  const missing = requiredNames.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

module.exports = {
  getConfig,
  assertEnv,
  REQUIRED_FOR_SERVER,
};
