import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/userModel.js";

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "14d" }
  );
}

export function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        return next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
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

export function configurePassport() {
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: process.env.GOOGLE_CALLBACK_URL
			},
			async (_accessToken, _refreshToken, profile, done) => {
				try {
					const email = profile.emails?.[0]?.value;

					if (!email) {
						return done(new Error("Google account does not expose an email."));
					}

					let user = await User.findOne({
						$or: [{ googleId: profile.id }, { email }]
					});

					if (!user) {
						user = await User.create({
						name: profile.displayName || email,
						email,
						googleId: profile.id
						});
					} else if (!user.googleId) {
						user.googleId = profile.id;
						await user.save();
					}

					return done(null, user);
				} catch (error) {
					return done(error);
				}
			}
		)
	);

  return passport;
}