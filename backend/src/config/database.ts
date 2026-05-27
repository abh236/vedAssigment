import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected) return true;

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/vedaai";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`🍃  MongoDB connected  →  ${uri}`);
    return true;
  } catch (err) {
    console.warn(`⚠️   MongoDB unavailable — falling back to in-memory store`);
    console.warn(`    (${(err as Error).message})`);
    return false;
  }
}

export function getIsConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
