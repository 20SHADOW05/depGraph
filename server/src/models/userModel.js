import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      default: null
    },
    googleId: {
      type: String,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
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

export const User = mongoose.models.User || mongoose.model("User", userSchema);
