const mongoose = require("mongoose");

const blacklistTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "Token is required."],
      unique: true,
      index: true,
    },
  },
  { timestamps: true },
);

// ── TTL index: auto-delete blacklisted tokens after 24 hours ──────────────────
// This matches the JWT expiry so the collection never grows unbounded
blacklistTokenSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 },
);

const tokenBlacklistModel = mongoose.model(
  "BlacklistTokens",
  blacklistTokenSchema,
);

module.exports = tokenBlacklistModel;
