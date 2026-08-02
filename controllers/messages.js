const Listing = require("../models/listing");
const MessageThread = require("../models/messageThread");

module.exports.createThreadMessage = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing || !listing.isActive) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }

  if (!listing.owner) {
    req.flash("error", "Listing is temporarily unavailable.");
    return res.redirect("/listings");
  }

  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You already own this listing.");
    return res.redirect(`/listings/${listing._id}`);
  }

  const thread = await MessageThread.findOneAndUpdate(
    {
      listing: listing._id,
      guest: req.user._id,
      host: listing.owner,
    },
    {
      $push: {
        messages: {
          sender: req.user._id,
          body: req.body.message.body,
        },
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  req.flash("success", "Message sent to the host.");
  res.redirect(`/listings/${thread.listing}`);
};

module.exports.reply = async (req, res) => {
  const thread = res.locals.thread;
  thread.messages.push({
    sender: req.user._id,
    body: req.body.message.body,
  });
  await thread.save();

  req.flash("success", "Reply sent.");
  res.redirect("/dashboard#messages");
};
