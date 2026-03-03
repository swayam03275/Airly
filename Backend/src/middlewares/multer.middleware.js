import multer from "multer";
import os from "os";

// for pfp media in user profile
const pfpStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
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
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

export const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});
