const crypto = require("crypto");
const ExpressError = require("../utils/ExpressError");

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function attachCsrfToken(req, res, next) {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = createToken();
  }

  res.locals.csrfToken = req.session ? req.session.csrfToken : "";
  next();
}

function verifyCsrfToken(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const submittedToken = req.body?._csrf || req.get("x-csrf-token");

  if (!req.session?.csrfToken || submittedToken !== req.session.csrfToken) {
    return next(new ExpressError(403, "Invalid or missing form token"));
  }

  next();
}

module.exports = {
  attachCsrfToken,
  verifyCsrfToken,
};
