const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, validateReport } = require("../middleware");
const reportController = require("../controllers/reports");

router.post("/", isLoggedIn, validateReport, wrapAsync(reportController.createReport));

module.exports = router;
