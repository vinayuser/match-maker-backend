const router = require("express").Router();
const AuthController = require("../controller/auth.controller");
const AdminAuthController = require("../controller/adminAuth.controller");
const AdminUserController = require("../controller/adminUser.controller");
const AdminTeamController = require("../controller/adminTeam.controller");
const AdminRoleController = require("../controller/adminRole.controller");
const OnboardingController = require("../controller/onboarding.controller");
const UploadController = require("../controller/upload.controller");
const DiscoveryController = require("../controller/discovery.controller");
const { authenticateUser } = require("../common/authenticate");
const { authenticateAdmin, authorizeRoles, authorizePermissions } = require("../common/authenticateAdmin");
const upload = require("../common/uploadMiddleware");

router.post("/api/v1/auth/register", AuthController.register);
router.post("/api/v1/auth/login", AuthController.login);
router.get("/api/v1/auth/me", authenticateUser, AuthController.me);
router.get("/api/v1/discovery/cards", authenticateUser, DiscoveryController.cards);
router.post("/api/v1/discovery/:targetUserId/connect", authenticateUser, DiscoveryController.sendInterest);

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
  authorizePermissions("dashboard:view"),
  AdminUserController.dashboard
);
router.get(
  "/api/v1/admin/permissions",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("roles:view"),
  AdminRoleController.listPermissions
);
router.get(
  "/api/v1/admin/roles",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("roles:view"),
  AdminRoleController.listRoles
);
router.post(
  "/api/v1/admin/roles",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminRoleController.createRole
);
router.get(
  "/api/v1/admin/roles/:id",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("roles:view"),
  AdminRoleController.roleDetail
);
router.patch(
  "/api/v1/admin/roles/:id",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminRoleController.updateRole
);
router.delete(
  "/api/v1/admin/roles/:id",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminRoleController.deleteRole
);
router.get(
  "/api/v1/admin/matchmakers",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("team:view"),
  AdminTeamController.listMatchmakers
);
router.post(
  "/api/v1/admin/matchmakers/avatar-upload",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  upload.single("photo"),
  AdminTeamController.uploadMatchmakerAvatar
);
router.post(
  "/api/v1/admin/matchmakers",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminTeamController.createMatchmaker
);
router.get(
  "/api/v1/admin/matchmakers/:id",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("team:view"),
  AdminTeamController.matchmakerDetail
);
router.patch(
  "/api/v1/admin/matchmakers/:id",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminTeamController.updateMatchmaker
);
router.patch(
  "/api/v1/admin/matchmakers/:id/lock",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminTeamController.lockMatchmaker
);
router.delete(
  "/api/v1/admin/matchmakers/:id",
  authenticateAdmin,
  authorizeRoles("super_admin"),
  AdminTeamController.deleteMatchmaker
);
router.get(
  "/api/v1/admin/approval-queue",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("approval_queue:view"),
  AdminUserController.approvalQueue
);
router.patch(
  "/api/v1/admin/approval-queue/:userId/review",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("approval_queue:review"),
  AdminUserController.reviewProfile
);
router.get(
  "/api/v1/admin/approval-queue/:userId",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("approval_queue:view"),
  AdminUserController.profileDetail
);
router.get(
  "/api/v1/admin/verified-users",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("verified_users:view"),
  AdminUserController.verifiedUsers
);
router.get(
  "/api/v1/admin/verified-users/:userId",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("verified_users:view"),
  AdminUserController.verifiedUserDetail
);
router.patch(
  "/api/v1/admin/verified-users/:userId",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("verified_users:update"),
  AdminUserController.updateVerifiedUser
);
router.patch(
  "/api/v1/admin/verified-users/:userId/lock",
  authenticateAdmin,
  authorizeRoles("super_admin", "matchmaker_admin"),
  authorizePermissions("verified_users:lock"),
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
