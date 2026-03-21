import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const buildMongoUri = (baseUri, dbName) => {
  if (!baseUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  try {
    const url = new URL(baseUri);
    const hasDatabaseInPath = url.pathname && url.pathname !== "/";

    if (!hasDatabaseInPath && dbName) {
      url.pathname = `/${dbName}`;
    }

    return url.toString();
  } catch {
    // Fallback for non-standard URI formats.
    return dbName ? `${baseUri.replace(/\/+$/, "")}/${dbName}` : baseUri;
  }
};

// try catch method is always best
const connectDB = async () => {
  try {
    const mongoUri = buildMongoUri(process.env.MONGODB_URI, DB_NAME);
    const connectionInstance = await mongoose.connect(mongoUri);
    console.log(
      `\nMongoDB connected yayyyy !! ${connectionInstance.connection.host}`,
    );
    return connectionInstance;
  } catch (error) {
    console.log("MONGODB connection FAILED", error);
    // Don't exit the process, let the calling function handle it
    throw error;
  }
};

export default connectDB;
