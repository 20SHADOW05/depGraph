import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verifyTokenHash: {
      type: String,
      default: null,
    },
    verifyTokenExpiry: {
      type: Date,
      default: null,
    },
    resetTokenHash: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
    unverifiedExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// middleware goes here, after schema definition
// can used to hash passwords where ever we use save() or create since create also triggers pre('save') internally
// but i dont want to use this.

// userSchema.pre("save", async function(next) {
//   if (this.isModified("passwordHash")) {
//     this.passwordHash = await bcrypt.hash(this.passwordHash, 10)
//   }
//   next()
// })

userSchema.index(
  { unverifiedExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { emailVerified: false } },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);