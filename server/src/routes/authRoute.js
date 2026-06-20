import { Router } from "express";
import { User  } from '../models/userModel.js';
import { signToken, hashPassword, comparePassword } from "../config/auth.js";
import passport from "passport";
import { authenticateToken } from "../config/auth.js";

const authRouter = Router();

authRouter.post('/signup' , async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if(existing) {
        return res.status(409).json({ message: "User already exists." })
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
        name: name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword
    });

    const token = signToken(user);
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 14 * 24 * 60 * 60 * 1000 // match 14d jwt expiry
    });

    res.redirect('http://localhost:5173/graph');
})

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return res.status(409).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signToken(user);
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 14 * 24 * 60 * 60 * 1000 
    });

    res.redirect('http://localhost:5173/graph');
})

authRouter.get('/google', (req, res, next) => { // redirects to google
    return passport.authenticate("google", {
            scope: ["profile", "email"],
            session: false
    })(req, res, next);
});

authRouter.get('/google/callback',
    passport.authenticate("google", { session: false }), (req, res, next) => { // verifies the response , attaches the user object to req
        const token = signToken(req.user); 
        res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 14 * 24 * 60 * 60 * 1000
        });
        res.redirect('http://localhost:5173/graph');
    }
)

authRouter.get('/me', authenticateToken, async (req, res) => {
    return res.status(200).json({ user: req.user, loading: false });
})

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out' });
});

authRouter.delete('/saved', authenticateToken, async (req, res) => {
  await Graph.deleteMany({ user: req.user.sub });
  return res.status(200).json({ message: 'Cleared' });
});

export default authRouter;