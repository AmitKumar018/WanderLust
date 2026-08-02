const Report = require("../models/report");

module.exports.createReport = async (req, res) => {
  const { targetType, targetId, reason } = req.body.report;

  await Report.create({
    reporter: req.user._id,
    targetType,
    targetId,
    targetModel: targetType === "listing" ? "Listing" : "Review",
    reason,
  });

  req.flash("success", "Thanks. Your report was submitted for review.");
  res.redirect(req.get("referer") || "/listings");
};
