const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
  },
  { timestamps: true }
);

const messageThreadSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

messageThreadSchema.index({ listing: 1, guest: 1, host: 1 }, { unique: true });
messageThreadSchema.index({ guest: 1, updatedAt: -1 });
messageThreadSchema.index({ host: 1, updatedAt: -1 });

module.exports = mongoose.model("MessageThread", messageThreadSchema);
