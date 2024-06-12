const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Order = require("../models/order");
const User = require("../models/user").default;



// Get All Courses
const getAllOrderService = async (res) => {
  const orders = await Order.find().sort({ createdAt: -1 })
  res.status(200).json({
    success: true,
    orders
  })
}
const getAllOrderInstructorService = async (res) => {
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
  const orders = await Order.find({ instructor: instructorId }).sort({ createdAt: -1 })
  res.status(200).json({
    success: true,
    orders
  })
}
const getUserOrdersForCourseService = async (userId, courseId, res) => {
  const orders = await Order.find({ userId: userId, courseId: courseId, }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    orders
  });
};



module.exports = { getAllOrderService, getUserOrdersForCourseService, getAllOrderInstructorService };