const router = require("express").Router();
const AuthController = require("../controller/auth.controller");
const OnboardingController = require("../controller/onboarding.controller");
const UploadController = require("../controller/upload.controller");
const { authenticateUser } = require("../common/authenticate");
const upload = require("../common/uploadMiddleware");

router.post("/api/v1/auth/register", AuthController.register);
router.post("/api/v1/auth/login", AuthController.login);
router.get("/api/v1/auth/me", authenticateUser, AuthController.me);

router.get("/api/v1/onboarding", authenticateUser, OnboardingController.getOnboarding);
router.patch("/api/v1/onboarding", authenticateUser, OnboardingController.patchOnboarding);
router.post("/api/v1/onboarding/submit", authenticateUser, OnboardingController.submitOnboarding);

router.post(
  "/api/v1/upload/photo",
  authenticateUser,
  upload.single("photo"),
  UploadController.uploadPhoto
);

module.exports = router;
