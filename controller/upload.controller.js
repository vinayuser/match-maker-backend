const { isConfigured, uploadProfileImage } = require("../common/cloudinaryClient");

module.exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.error(400, "FILE_REQUIRED");
    }
    if (!isConfigured()) {
      return res.error(503, "CLOUDINARY_NOT_CONFIGURED");
    }

    const result = await uploadProfileImage(req.file.buffer, { userId: req.user.id });

    return res.success("UPLOADED", {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (e) {
    next(e);
  }
};
