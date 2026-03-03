import dotenv from "dotenv";
import app from "../Backend/src/app.js";
import connectDB from "../Backend/src/db/index.js";

dotenv.config({ path: "./Backend/.env" });

// Connect to database once (cached connection)
let isConnected = false;
let connectionPromise = null;

const connectToDatabase = async () => {
  if (isConnected) {
    return Promise.resolve();
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = connectDB()
    .then(() => {
      isConnected = true;
      console.log("MongoDB connected for serverless function");
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error);
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

// Serverless function handler
export default async (req, res) => {
  try {
    await connectToDatabase();
    // Pass request to Express app
    app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
