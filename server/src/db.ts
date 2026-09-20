import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) return;
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kalobazar";
    await mongoose.connect(uri);
    console.log(`MongoDB connected successfully to ${uri}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}
