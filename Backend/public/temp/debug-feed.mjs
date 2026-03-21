import dotenv from "dotenv";
import mongoose from "mongoose";
import { Tweet } from "../../src/models/tweet.model.js";

dotenv.config({ path: "./.env" });
await mongoose.connect(process.env.MONGODB_URI);

const posts = await Tweet.aggregate([
  { $sort: { createdAt: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user",
      pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, pfp: 1 } }],
    },
  },
  { $unwind: "$user" },
  { $project: { title: 1, user: 1, createdAt: 1 } },
]);

console.log("agg_posts_count:", posts.length);
console.log(JSON.stringify(posts, null, 2));

await mongoose.disconnect();
