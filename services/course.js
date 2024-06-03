const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Course = require("../models/course");
const User = require("../models/user");

// Get All Courses
const getAllCoursesService = async (res) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    courses,
  });
};

const getAllInstructorCoursesService = async (res) => {
  try {
    // Find the first user with the role "instructor"
    const instructor = await User.findOne({ role: "instructor" });

    if (!instructor) {
      // Handle the case where no instructor is found
      return res.status(404).json({
        success: false,
        message: "No instructor found",
      });
    }

    // Extract the instructorId from the found instructor
    const instructorId = instructor._id;

    // Retrieve courses for the instructor
    const courses = await Course.find({ instructor: instructorId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { getAllCoursesService, getAllInstructorCoursesService };
