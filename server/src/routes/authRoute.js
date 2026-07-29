import { Router } from "express";
import { User } from "../models/userModel.js";
import { Graph } from "../models/graphModel.js";
import {
  signToken,
  hashPassword,
  comparePassword,
  generateToken,
  hashToken,
} from "../config/auth.js";
import passport from "passport";
import { authenticateToken } from "../config/auth.js";
import { sendMail } from "../utils/mailer.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "User already exists." });
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name: name,
    email: email.toLowerCase(),
    passwordHash: hashedPassword,
  });

  // generate verification token on signup
  try {
    const token = generateToken();
    user.verifyTokenHash = hashToken(token);
    user.verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/verify?token=${token}&email=${encodeURIComponent(user.email)}`;
    await sendMail({
      to: user.email,
      subject: "Verify your depGraph account",
      html: `Click <a href="${link}">here</a> to verify your email.`,
    });
  } catch (e) {
    console.warn("Failed to send verification email", e?.message || e);
  }

  const token = signToken(user);
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 14 * 24 * 60 * 60 * 1000, // match 14d jwt expiry
  });

  res.redirect("http://localhost:5173/graph");
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(409).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = signToken(user);
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });

  res.redirect("http://localhost:5173/graph");
});

// request email verification (if user needs a new link)
authRouter.post("/request-verify", authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "email is required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: "User not found" });

  const token = generateToken();
  user.verifyTokenHash = hashToken(token);
  user.verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/verify?token=${token}&email=${encodeURIComponent(user.email)}`;
  await sendMail({
    to: user.email,
    subject: "Verify your depGraph account",
    html: `Click <a href="${link}">here</a> to verify your email.`,
  });

  return res.status(200).json({ message: "Verification email sent" });
});

// verify link endpoint used by frontend (GET)
authRouter.get("/verify", async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email)
    return res.status(400).json({ message: "token and email required" });

  const hash = hashToken(String(token));
  const user = await User.findOne({
    email: String(email).toLowerCase(),
    verifyTokenHash: hash,
  });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });
  if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date())
    return res.status(400).json({ message: "Token expired" });

  user.emailVerified = true;
  user.verifyTokenHash = null;
  user.verifyTokenExpiry = null;
  await user.save();

  const redirect = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/verified`;
  return res.redirect(redirect);
});

// request password reset
authRouter.post("/request-reset", authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "email is required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: "User not found" });

  const token = generateToken();
  user.resetTokenHash = hashToken(token);
  user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/reset?token=${token}&email=${encodeURIComponent(user.email)}`;
  await sendMail({
    to: user.email,
    subject: "Reset your depGraph password",
    html: `Click <a href="${link}">here</a> to reset your password.`,
  });

  return res.status(200).json({ message: "Password reset email sent" });
});

// perform password reset (POST)
authRouter.post("/reset", authLimiter, async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password)
    return res
      .status(400)
      .json({ message: "token, email and password are required" });

  const hash = hashToken(String(token));
  const user = await User.findOne({
    email: String(email).toLowerCase(),
    resetTokenHash: hash,
  });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });
  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date())
    return res.status(400).json({ message: "Token expired" });

  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = null;
  user.resetTokenExpiry = null;
  await user.save();

  return res.status(200).json({ message: "Password updated" });
});

authRouter.get("/google", (req, res, next) => {
  // redirects to google
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res, next) => {
    // verifies the response , attaches the user object to req
    const token = signToken(req.user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
    res.redirect("http://localhost:5173/graph");
  },
);

authRouter.get("/me", authenticateToken, async (req, res) => {
  return res.status(200).json({ user: req.user, loading: false });
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out" });
});

authRouter.post("/save", authenticateToken, async (req, res, next) => {
  try {
    const { source, rootName, fileName, nodes, edges } = req.body;

    if (!rootName || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({ message: "Invalid graph data" });
    }

    const existing = await Graph.findOne({ user: req.user.sub, rootName });
    if (existing) {
      return res.status(409).json({ message: "Graph already saved" });
    }

    const graph = await Graph.create({
      user: req.user.sub,
      source,
      rootName,
      fileName: fileName || null,
      nodes,
      edges,
    });

    return res.status(201).json({ message: "Graph saved", graph });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/saved", authenticateToken, async (req, res) => {
  const graphs = await Graph.find({ user: req.user.sub }).sort({
    createdAt: -1,
  });
  return res.json({ graphs });
});

authRouter.delete("/saved/:id", authenticateToken, async (req, res, next) => {
  try {
    const graph = await Graph.findOneAndDelete({
      _id: req.params.id,
      user: req.user.sub,
    });
    if (!graph) return res.status(404).json({ message: "Graph not found" });
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

authRouter.delete("/saved", authenticateToken, async (req, res) => {
  await Graph.deleteMany({ user: req.user.sub });
  return res.status(200).json({ message: "Cleared" });
});

export default authRouter;
