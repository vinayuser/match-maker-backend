const multer = require("multer");

/** Keep file in memory — uploaded to Cloudinary in the controller (no disk storage). */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) {
      return cb(new Error("INVALID_FILE_TYPE"));
    }
    cb(null, true);
  }
});

module.exports = upload;
