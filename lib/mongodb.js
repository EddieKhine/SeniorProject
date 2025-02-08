import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  throw new Error("⚠️ MONGO_URI is not defined in environment variables!");
}

const dbConnect = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log("✅ Already connected to database");
      return;
    }
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to database successfully!");
  } catch (error) {
    console.error("❌ Database connection failed!", error);
  }
};

export default dbConnect;