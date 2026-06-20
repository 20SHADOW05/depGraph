import mongoose from "mongoose";

export default async function initDb() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });

  return mongoose.connection;
}