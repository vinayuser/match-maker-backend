const router = require("express").Router();
const AuthController = require("../controller/auth.controller");
const AdminAuthController = require("../controller/adminAuth.controller");
const AdminUserController = require("../controller/adminUser.controller");
const OnboardingController = require("../controller/onboarding.controller");
const UploadController = require("../controller/upload.controller");
const { authenticateUser } = require("../common/authenticate");
const { authenticateAdmin, authorizeRoles } = require("../common/authenticateAdmin");
const upload = require("../common/uploadMiddleware");

router.post("/api/v1/auth/register", AuthController.register);
router.post("/api/v1/auth/login", AuthController.login);
router.get("/api/v1/auth/me", authenticateUser, AuthController.me);

router.post("/api/v1/admin/auth/bootstrap", AdminAuthController.bootstrapSuperAdmin);
router.post("/api/v1/admin/auth/login", AdminAuthController.login);
router.get("/api/v1/admin/auth/me", authenticateAdmin, AdminAuthController.me);

router.post(
  "/api/v1/admin/users",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminUserController.create
);
router.get(
  "/api/v1/admin/users",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminUserController.list
);
router.patch(
  "/api/v1/admin/users/:id",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminUserController.update
);
router.get(
  "/api/v1/admin/dashboard",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  AdminUserController.dashboard
);
router.get(
  "/api/v1/admin/approval-queue",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  AdminUserController.approvalQueue
);
router.patch(
  "/api/v1/admin/approval-queue/:userId/review",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  AdminUserController.reviewProfile
);
router.get(
  "/api/v1/admin/approval-queue/:userId",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  AdminUserController.profileDetail
);
router.get(
  "/api/v1/admin/verified-users",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  AdminUserController.verifiedUsers
);
router.get(
  "/api/v1/admin/verified-users/:userId",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  AdminUserController.verifiedUserDetail
);
router.patch(
  "/api/v1/admin/verified-users/:userId",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  AdminUserController.updateVerifiedUser
);
router.patch(
  "/api/v1/admin/verified-users/:userId/lock",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  AdminUserController.lockVerifiedUser
);

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
