import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kalobazar";

// Connection pooling & performance options
const MONGO_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: 25, // Maintain up to 25 socket connections
  minPoolSize: 5,  // Keep at least 5 connections open
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

let isConnecting = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (isConnecting) {
    // Wait for the in-flight connection attempt
    return new Promise((resolve, reject) => {
      mongoose.connection.once("open", () => resolve(mongoose));
      mongoose.connection.once("error", reject);
    });
  }

  try {
    isConnecting = true;

    // Attach lifecycle listeners once
    if (mongoose.connection.listeners("connected").length === 0) {
      mongoose.connection.on("connected", () => {
        console.log("[MongoDB] Connection pool established successfully.");
      });

      mongoose.connection.on("error", (err) => {
        console.error("[MongoDB] Connection pool error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("[MongoDB] Connection lost. Reconnecting...");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("[MongoDB] Connection successfully re-established.");
      });
    }

    await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
    isConnecting = false;
    return mongoose;
  } catch (error) {
    isConnecting = false;
    console.error("[MongoDB] Initial connection error:", error);
    // Do not terminate process immediately; let caller handle or retry
    throw error;
  }
}

export default connectDB;
