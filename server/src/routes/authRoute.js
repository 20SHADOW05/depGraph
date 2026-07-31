import { Router } from "express";
import { User } from "../models/userModel.js";
import { Graph } from "../models/graphModel.js";
import {
    signToken,
    hashPassword,
    comparePassword,
    generateToken,
    hashToken,
    validatePassword,
} from "../config/auth.js";
import passport from "passport";
import { authenticateToken } from "../config/auth.js";
import { sendMail } from "../utils/mailer.js";
import rateLimit from "express-rate-limit";
import { getAuthCookieOptions } from "../config/auth.js";

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        return res.status(400).json({ message: passwordError });
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

    // generate verification token on signup — email verification is mandatory
    const token = generateToken();
    user.verifyTokenHash = hashToken(token);
    user.verifyTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    user.unverifiedExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/verify?token=${token}&email=${encodeURIComponent(user.email)}`;
    try {
        await sendMail({
            to: user.email,
            subject: "Verify your depGraph account",
            html: `
                <h2>Verify your depGraph account</h2>

                <p>Thanks for signing up!</p>

                <p>Please click the button below to verify your email:</p>

                <p>
                    <a href="${link}"
                    style="
                        background:#2563eb;
                        color:#ffffff;
                        padding:12px 20px;
                        text-decoration:none;
                        border-radius:6px;
                        display:inline-block;
                    " 
                    target="_blank" rel="noopener noreferrer">
                    Verify Email
                    </a>
                </p>
                `,
            text: `or you can verify your email by visiting:\n${link}`,
        });
    } catch (err) {
        console.error('sendMail failed during signup, cleaning up user', err);
        // cleanup the partially-created user to keep DB consistent
        try {
            await User.deleteOne({ _id: user._id });
        } catch (cleanupErr) {
            console.error('Failed to delete user after sendMail failure', cleanupErr);
        }

        return res.status(502).json({ message: 'Failed to send verification email; try again later' });
    }

    return res.status(200).json({
        message: "Signup successful. Check your email to verify your account.",
        email: user.email,
    });
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

    if (!user.emailVerified) {
        return res
            .status(403)
            .json({ message: "Email not verified. Check your inbox for verification link." });
    }

    const token = signToken(user);
    res.cookie("token", token, getAuthCookieOptions());

    const redirectTarget = `${process.env.FRONTEND_URL || "http://localhost:5173"}/graph`;

    return res.status(200).json({
        message: "Login successful",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
        },
        redirectTo: redirectTarget,
    });
});

// request email verification (if user needs a new link)
authRouter.post("/request-verify", authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.emailVerified) {
        return res.status(200).json({
            message: "If an unverified account exists, a verification email was sent",
        });
    }

    const token = generateToken();
    user.verifyTokenHash = hashToken(token);
    user.verifyTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    user.unverifiedExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/verify?token=${token}&email=${encodeURIComponent(user.email)}`;
    try {
        await sendMail({
            to: user.email,
            subject: "Verify your depGraph account",
            html: `
            <h2>Verify your depGraph account</h2>

            <p>You requested a new verification email.</p>

            <p>Please click the button below to verify your email:</p>

            <p>
                <a
                    href="${link}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        background:#2563eb;
                        color:#ffffff;
                        padding:12px 20px;
                        text-decoration:none;
                        border-radius:6px;
                        display:inline-block;
                    "
                >
                    Verify Email
                </a>
            </p>
        `,
            text: `or you can verify your email by visiting:\n${link}`,
        });
    } catch (err) {
        console.error("sendMail failed during verification request", err);
    }

    return res.status(200).json({
        message: "If the email exists, a verification link was sent",
    });
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
    user.unverifiedExpiresAt = null;
    user.verifyTokenHash = null;
    user.verifyTokenExpiry = null;
    await user.save();

    return res.status(200).json({
        message: "Email verified successfully",
        redirectTo: "/auth/verified",
    });
});

// request password reset
authRouter.post("/request-reset", authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(200).json({
            message: "If the email exists, a reset link was sent.",
        });
    }

    const token = generateToken();
    user.resetTokenHash = hashToken(token);
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/reset?token=${token}&email=${encodeURIComponent(user.email)}`;
    try {
        await sendMail({
            to: user.email,
            subject: "Reset your depGraph password",
            html: `
            <h2>Reset your depGraph password</h2>

            <p>We received a request to reset your password.</p>

            <p>Click the button below to choose a new password:</p>

            <p>
                <a
                    href="${link}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        background:#dc2626;
                        color:#ffffff;
                        padding:12px 20px;
                        text-decoration:none;
                        border-radius:6px;
                        display:inline-block;
                    "
                >
                    Reset Password
                </a>
            </p>
        `,
            text: `Reset your depGraph account password by visiting:\n${link}`,
        });
    } catch (err) {
        console.error("sendMail failed during password reset request", err);
    }

    return res.status(200).json({
        message: "If the email exists, a reset link was sent.",
    });
});

// perform password reset (POST)
authRouter.post("/reset", authLimiter, async (req, res) => {
    const { token, email, password } = req.body;
    if (!token || !email || !password)
        return res
            .status(400)
            .json({ message: "token, email and password are required" });

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

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
        res.cookie("token", token, getAuthCookieOptions());
        res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/graph`);
    },
);

// change password while authenticated
authRouter.post("/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return res
                .status(400)
                .json({ message: "currentPassword and newPassword are required" });

        const passwordError = validatePassword(newPassword);
        if (passwordError) return res.status(400).json({ message: passwordError });

        const user = await User.findById(req.user.sub);
        if (!user) return res.status(404).json({ message: "User not found" });

        const ok = await comparePassword(currentPassword, user.passwordHash);
        if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

        user.passwordHash = await hashPassword(newPassword);
        await user.save();

        return res.status(200).json({ message: "Password changed" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});

authRouter.get("/me", authenticateToken, async (req, res) => {
    return res.status(200).json({ user: req.user, loading: false });
});

authRouter.post("/logout", (req, res) => {
	const { maxAge, ...clearOptions } = getAuthCookieOptions();
	res.clearCookie("token", clearOptions);
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
