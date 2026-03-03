import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://airly-frontend.vercel.app" // Replace with your frontend's Vercel URL
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

// Multer size-limit handler
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ message: "Profile picture too large. Max 3MB allowed." });
  }
  return next(err);
});

// routes import
import adminRouter from "./routes/admin.routes.js";
import bookmarkRouter from "./routes/bookmark.routes.js";
import commentRouter from "./routes/comment.routes.js";
import feedRouter from "./routes/feed.routes.js";
import likeRouter from "./routes/like.routes.js";
import profileRouter from "./routes/profile.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import userRouter from "./routes/user.routes.js";
import viewsRouter from "./routes/views.routes.js";

// routes declaration
const apiRouter = express.Router();

apiRouter.use("/users", userRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/tweets", tweetRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/feed", feedRouter);
apiRouter.use("/", commentRouter);
apiRouter.use("/views", viewsRouter);
apiRouter.use("/likes", likeRouter);
apiRouter.use("/bookmarks", bookmarkRouter);

app.use("/api/v1", apiRouter);

// http://localhost:8000/api/v1/users/register

// Centralized JSON error handler (last middleware)
app.use((err, req, res, next) => {
  const status = err?.statusCode || err?.status || 500;
  const message = err?.message || "Internal Server Error";
  // Optionally include stack in development
  const payload = { success: false, message };
  if (process.env.NODE_ENV !== "production" && err?.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
});

export default app;
