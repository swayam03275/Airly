import multer from "multer";

// for pfp media in user profile
const pfpStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the /tmp directory for serverless environments
    const tempDir =
      process.env.NODE_ENV === "production" ? "/tmp" : "./public/temp";
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const uploadPfp = multer({
  storage: pfpStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 mb limit
});

// for pics in tweets
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./public/temp"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

export const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});
