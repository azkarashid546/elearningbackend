const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const Order = require("../models/order");
const User = require("../models/user").default;
const Course = require("../models/course");
const path = require("path");
const ejs = require("ejs");
const sendMail = require("../utils/sendMail");
const Notification = require("../models/notification");
const { getAllOrderService, getUserOrdersForCourseService, getAllOrderInstructorService } = require("../services/order");
const redis = require("../utils/redis");
require("dotenv").config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// create order
const createOrder = catchAsyncErrors(async (req, res, next) => {
  try {
    // Extract necessary data from the request body
    const { courseId, payment_info } = req.body;

    if (req.user?.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Admins and instructors cannot purchase courses",
      });
    }

    // Find the instructor with the role "instructor"
    const instructor = await User.findOne({ role: "instructor" });
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "No instructor found",
      });
    }
    const instructorId = instructor._id;

    // Check if the user role is "user"
    const user = await User.findById(req.user?._id);


    // Check payment authorization if payment_info is provided
    if (payment_info && payment_info.id) {
      const paymentIntentId = payment_info.id;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return next(new ErrorHandler("Payment not authorized!", 400));
      }
    }

    // Check if the user has already purchased the course
    const courseExistInUser = user?.courses.some(course => course.toString() === courseId);
    if (courseExistInUser) {
      return next(new ErrorHandler("You have already purchased this course", 400));
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Prepare order data
    const data = {
      instructor: instructorId,
      courseId: course._id,
      userId: user?._id,
      payment_info,
    };

    // Prepare data for order confirmation email
    const mailData = {
      order: {
        _id: course._id.toString().slice(0, 6),
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    };

    // Render the email template
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/order-confirmation.ejs"),
      { order: mailData }
    );

    // Send order confirmation email to the user
    try {
      if (user) {
        await sendMail({
          email: user.email,
          subject: "Order Confirmation",
          template: "order-confirmation.ejs",
          data: mailData,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }

    // Update user's course list
    user.courses.push(course._id);
    await user.save();

    // Fetch the updated user data
    const updatedUser = await User.findById(req.user?._id);

    // Log the user ID and the updated user data
    console.log('Updated User ID:', req.user?.id);
    console.log('Updated User Data:', updatedUser);

    // Ensure user ID is valid before storing in Redis
    if (req.user?.id) {
      // Store the updated user data in Redis
      await redis.set(req.user?.id, JSON.stringify(updatedUser));
      console.log('User data successfully stored in Redis.');
    } else {
      console.error('Invalid User ID, unable to store in Redis.');
    }

    // Increment purchased count for the course
    course.purchased++;
    await course.save();

    // Create the order
    const order = await Order.create(data);

    // Return success response
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});



// get all orders --- only for admin
const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  try {
    getAllOrderService(res)
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
})
const getAllOrdersInstructor = catchAsyncErrors(async (req, res, next) => {
  try {
    getAllOrderInstructorService(res)
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
})


const getUserOrdersForCourse = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userId, courseId } = req.body;
    await getUserOrdersForCourseService(userId, courseId, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// send stripe publishable key
const sendStripePublishableKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  })
})

// new Payment
const newPayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "USD",
      metadata: {
        company: "E-Learning",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

module.exports = { createOrder, getAllOrders, sendStripePublishableKey, newPayment, getUserOrdersForCourse, getAllOrdersInstructor }