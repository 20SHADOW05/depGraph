import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/userModel.js";
import crypto from "crypto";

export function signToken(user) {
	return jwt.sign(
		{
			sub: user._id.toString(),
			name: user.name || user.displayName,
			email: user.email,
		},
		process.env.JWT_SECRET,
		{ expiresIn: "14d" },
	);
}

export function getAuthCookieOptions() {
	const isProduction = process.env.NODE_ENV === "production";

	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: "none",
		path: "/",
		maxAge: 14 * 24 * 60 * 60 * 1000,
	};
}

export function authenticateToken(req, res, next) {
	const token = req.cookies.token;
	if (!token) return res.status(401).json({ message: "Unauthorized" });

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = payload;
		return next();
	} catch {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
}

export async function hashPassword(password) {
	return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
	if (!hash) {
		return false;
	}

	return bcrypt.compare(password, hash);
}

export function validatePassword(password) {
	if (typeof password !== "string" || password.length < 8) {
		return "Password must be at least 8 characters";
	}

	const strengthChecks = [
		/[A-Z]/.test(password),
		/[0-9]/.test(password),
		/[^A-Za-z0-9]/.test(password),
	];

	if (strengthChecks.filter(Boolean).length < 1) {
		return "Password must include an uppercase letter, number, or symbol";
	}

	return null;
}

export function configurePassport() {
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: process.env.GOOGLE_CALLBACK_URL,
			},
			async (_accessToken, _refreshToken, profile, done) => {
				try {
					const email = profile.emails?.[0]?.value;

					if (!email) {
						return done(new Error("Google account does not expose an email."));
					}

					let user = await User.findOne({
						$or: [{ googleId: profile.id }, { email }],
					});

					if (!user) {
						user = await User.create({
							name: profile.displayName || email,
							email,
							googleId: profile.id,
							emailVerified: true,
						});
					} else if (!user.googleId) {
						user.googleId = profile.id;
						user.emailVerified = true;
						await user.save();
					}

					return done(null, user);
				} catch (error) {
					return done(error);
				}
			},
		),
	);

	return passport;
}

export function generateToken() {
	return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
	return crypto.createHash("sha256").update(token).digest("hex");
}
