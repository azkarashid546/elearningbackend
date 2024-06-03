const express = require("express");
const {
  registerUser,
  activateUser,
  loginUser,
  logoutUser,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateProfilePicture,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserCourses,
  getAllUsersInstructor,
  getUserCourseDataCompletionProgress,
  updateCourseProgress,// Import the markVideoAsCompleted controller function
} = require("../controllers/user");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");


const router = express.Router();

router.post("/registeration", registerUser);
router.post("/activate-user", activateUser);
router.post("/login-user", loginUser);
router.get("/logout-user", isAuthenticated, logoutUser);

router.get("/me", isAuthenticated, getUserInfo);
router.post("/socialauth", socialAuth);
router.put("/updateuser", isAuthenticated, updateUserInfo);
router.put("/updatepassword", isAuthenticated, updatePassword);
router.put("/updateprofilepicture", isAuthenticated, updateProfilePicture);

router.get("/get-users", isAuthenticated, authorizeRoles("admin" ), getAllUsers);
router.get("/get-users-instructor", isAuthenticated, authorizeRoles("instructor"), getAllUsers);
router.put("/update-user-role", isAuthenticated, authorizeRoles("admin"), updateUserRole);
router.delete("/delete-user/:id", isAuthenticated, authorizeRoles("admin"), deleteUser);
router.get("/get-user-complete-course", isAuthenticated, authorizeRoles("instructor"), getUserCourseDataCompletionProgress);
router.get("/update-course-progress", isAuthenticated, updateCourseProgress);

module.exports = router;

