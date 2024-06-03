const express = require("express");
const {
  uploadCourse,
  editCourse,
  getSingleCourse,
  getAllCourses,
  getCourseByUser,
  addQuestion,
  addAnswer,
  addReview,
  addReplyReview,
  getAllCoursesAdmin,
  deleteCourse,
  generateVideoUrl,
  uploadCertificate,
  getAllCoursesByUser,
  getAllCoursesInstructor
} = require("../controllers/course");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const adminRole = require("../middleware/role");
const multer = require('multer');
const upload = multer({ dest: './uploads/' });

const CourseRouter = express.Router();

CourseRouter.post(
  "/create-course",

  isAuthenticated,
  authorizeRoles("instructor"),
  uploadCourse
);

CourseRouter.put(
  "/edit-course/:id",

  isAuthenticated,
  authorizeRoles("instructor"),
  editCourse
);
CourseRouter.get(
  "/get-course/:id",

  getSingleCourse
);

CourseRouter.get("/get-courses", getAllCourses);
CourseRouter.get("/get-all-user-courses", isAuthenticated, getAllCoursesByUser);
CourseRouter.get("/get-course-content/:id", isAuthenticated, getCourseByUser);

CourseRouter.put("/add-question", isAuthenticated, addQuestion);

CourseRouter.put("/add-answer", isAuthenticated, addAnswer);

CourseRouter.put("/add-review/:id", isAuthenticated, addReview);

CourseRouter.put(
  "/add-review-reply",

  isAuthenticated,
  authorizeRoles("admin"),
  addReplyReview
);
CourseRouter.put(
  "/add-review-reply-instructor",

  isAuthenticated,
  authorizeRoles("instructor"),
  addReplyReview
);

CourseRouter.get(
  "/get-courses-admin",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCoursesAdmin
);
CourseRouter.get(
  "/get-courses-instructor",
  isAuthenticated,
  authorizeRoles("instructor"),
  getAllCoursesAdmin
);
CourseRouter.get(
  "/get-all-courses-instructor",
  isAuthenticated,
  authorizeRoles("instructor"),
  getAllCoursesInstructor
);
CourseRouter.post(
  "/getVdoCipherOTP",

  generateVideoUrl
);

CourseRouter.delete(
  "/delete-course/:id",
  isAuthenticated,
  authorizeRoles("instructor"),
  deleteCourse
);

module.exports = CourseRouter;
