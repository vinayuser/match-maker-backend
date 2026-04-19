const cloudinary = require("cloudinary").v2;

/**
 * Cloudinary reads `CLOUDINARY_URL` from the environment when set (see Cloudinary Node SDK).
 * Ensure `config/.env` is loaded before this module is required (see `app.js`).
 */
function isConfigured() {
  return Boolean(process.env.CLOUDINARY_URL);
}

/**
 * @param {Buffer} buffer
 * @param {{ userId?: string|number }} [meta]
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
function uploadProfileImage(buffer, meta = {}) {
  const uid = meta.userId != null ? `u${meta.userId}` : "anon";
  const publicId = `${uid}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "kesher/profiles",
        resource_type: "image",
        overwrite: false,
        public_id: publicId
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

module.exports = {
  cloudinary,
  isConfigured,
  uploadProfileImage
};
