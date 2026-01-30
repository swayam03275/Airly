import dotenv from "dotenv";
import app from "../Backend/src/app.js";
import connectDB from "../Backend/src/db/index.js";

dotenv.config({ path: "./Backend/.env" });

// Connect to database once
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    await connectDB();
    isConnected = true;
    console.log("MongoDB connected for serverless function");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
};

// Serverless function handler
export default async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};
