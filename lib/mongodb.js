import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

console.log("🔍 MONGODB_URI loaded:", MONGODB_URI ? "✅ Yes" : "❌ No");

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  console.log("Available env vars:", Object.keys(process.env).filter(key => key.includes('MONGO')));
  throw new Error("Please define the MONGODB_URI environment variable inside .env or .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    console.log("✅ Using existing database connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ New database connection established");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default dbConnect;