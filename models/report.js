const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["listing", "review"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetModel",
    },
    targetModel: {
      type: String,
      enum: ["Listing", "Review"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    status: {
      type: String,
      enum: ["open", "reviewed", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true }
);

reportSchema.index({ targetType: 1, targetId: 1, status: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
