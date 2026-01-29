import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

export default app;

startServer();

app.get("/", (req, res) => {
  res.send("Yo, backend is live! Welcome to the API.");
});
