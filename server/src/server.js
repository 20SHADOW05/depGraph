import express from "express";
const server = express();

import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";

import initDb from "./config/db.js";
import { configurePassport } from "./config/auth.js";

const frontendOrigin = process.env.FRONTEND_URL || true;

server.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
server.use(passport.initialize());
server.use(cookieParser());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

import uploadRouter from "./routes/uploadRoute.js";
import authRouter from "./routes/authRoute.js";

server.use("/graph", uploadRouter);
server.use("/auth", authRouter);

server.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: "Internal server error" });
});

async function start() {
  try {
    await initDb();
    configurePassport();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB; server did not start.", error);
    process.exitCode = 1;
  }
}

start();
