const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const {getAllCoursesService, getAllInstructorCoursesService} = require("../services/course");
const ErrorHandler = require("../utils/ErrorHandler");
const cloudinary = require("cloudinary");
const Course = require("../models/course");
const redis = require("../utils/redis");
const { default: mongoose } = require("mongoose");
const sendMail = require("../utils/sendMail");
const ejs = require("ejs");
const path = require("path");
const Notification = require("../models/notification");
const axios = require("axios");

const { updateProfilePicture, updateUserInfo, updatePassword } = require("./user");
const UserVideoHistory = require("../models/userVedioHistory");
const User = require("../models/user");


// upload course

const uploadCourse = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.body;
    
    const instructor = await User.findOne({ role: "instructor" });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "No instructor found",
      });
    }

    const instructorId = instructor._id;
    data.instructor = instructorId;

    if (data.thumbnail) {
      const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
        folder: "courses",
      });
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const course = await Course.create(data);

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Failed to upload course", 400));
  }
});



// edit course
const editCourse = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.body;
    const thumbnail = data.thumbnail;
    const courseId = req.params.id;
   const courseData = await Course.findById(courseId)

    if (thumbnail && !thumbnail.startsWith("https")) {
      await cloudinary.v2.uploader.destroy(thumbnail.public_id);
      const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
        folder: "courses",
      });
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    if(thumbnail.startsWith("https")){
      data.thumbnail ={
        public_id : courseData?.thumbnail.public_id,
        url : courseData?.thumbnail.url
      }
    }
    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        $set: data,
      },
      { $new: true }
    );
    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get single course --- without purchasing
const getSingleCourse = catchAsyncErrors(async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const isCacheExist = await redis.get(courseId);
    if (isCacheExist) {
      console.log("hitting redis");
      const course = JSON.parse(isCacheExist);
      res.status(200).json({
        success: true,
        course,
      });
    } else {
      const course = await Course.findById(req.params.id).select(
        "-courseData.vedioUrl -courseData.suggestion -courseData.questions -courseData.links"
      );
      console.log("hitting mongodb");
      await redis.set(courseId, JSON.stringify(course), 'EX', 604800);

      res.status(200).json({
        success: true,
        course,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// get all courses --- without purchasing
const getAllCourses = catchAsyncErrors(async (req, res, next) => {
  try {
   
      const courses = await Course.find().select(
        "-courseData.vedioUrl -courseData.suggestion -courseData.questions -courseData.links"
      );
      console.log("hitting mongodb");
    
      res.status(200).json({
        success: true,
        courses,
      });
    
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get course content --- only for valid user
const getCourseByUser = catchAsyncErrors(async (req, res, next) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.user?._id);

    // Ensure that the user is authenticated
    if (!user) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    // Retrieve the requested course ID from the URL parameters
    const courseId = req.params.id;

    // Check if the user has the requested course in their purchased courses
    const hasCourse = user.courses.some(course => course._id.toString() === courseId);

    if (!hasCourse) {
      return next(new ErrorHandler("You are not eligible to access this course", 403));
    }

    // Find the course by ID
    const course = await Course.findById(courseId);

    // Check if the course exists
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Retrieve the course content
    const content = course.courseData;

    // Respond with the course content
    res.status(200).json({
      success: true,
      content,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    return next(new ErrorHandler(error.message, 500));
  }
});



const getAllCoursesByUser = catchAsyncErrors(async (req, res, next) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.user?._id);

    // Ensure that the user is authenticated
    if (!user) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const userCourseList = user.courses;

    // If the user doesn't have any courses, return an empty array
    if (!userCourseList || userCourseList.length === 0) {
      return res.status(200).json({ success: true, courses: [] });
    }

    // Extract the IDs of the courses associated with the user
    const courseIds = userCourseList.map((course) => course._id);

    // Fetch details of all courses associated with the user
    const courses = await Course.find({ _id: { $in: courseIds } });

    // Return the array of full course objects
    res.status(200).json({
      success: true,
      courses: courses,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// add question in course
const addQuestion = catchAsyncErrors(async (req, res, next) => {
  try {
    const { question, courseId, contentId } = req.body;
    const course = await Course.findById(courseId);
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler("Invalid Content Id", 400));
    }

    const courseContent = course?.courseData?.find((item) =>
      item._id.equals(contentId)
    );
    if (!courseContent) {
      return next(new ErrorHandler("Invalid Content Id", 400));
    }

    // create a new questions object
    const newQuestion = {
      user: req.user,
      question,
      questionReplies: [],
    };

    // add this question to out course content
    courseContent.questions.push(newQuestion);

    await Notification.create({
      user: req.user?._id,
      title: "New Question Recieved",
      message: `You have a new question in ${courseContent?.title}`,
    });

    // if (req.body.avatar) {
    //   req.body.user = req.user;
    //   await updateProfilePicture(req, res, next);
    // }
    // if (req.body.name) {
    //   req.body.user = req.user;
    //   await updateUserInfo(req, res, next);
    // }
    // if (req.body.password) {
    //   req.body.user = req.user;
    //   await updatePassword(req, res, next);
    // }
    // save the updatyed course


    await course?.save();
    await redis.set(courseId, JSON.stringify(course), "Ex" , 604800)
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// add answer in course question
const addAnswer = catchAsyncErrors(async (req, res, next) => {
  try {
    const { answer, courseId, contentId, questionId } = req.body;
    const course = await Course.findById(courseId);
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler("Invalid Content Id", 400));
    }

    const courseContent = course?.courseData?.find((item) =>
      item._id.equals(contentId)
    );
    if (!courseContent) {
      return next(new ErrorHandler("Invalid Content Id", 400));
    }

    const question = courseContent?.questions?.find((item) =>
      item._id.equals(questionId)
    );

    if (!question) {
      return next(new ErrorHandler("Invalid Question Id", 400));
    }
    // create a new answer object
    const newAnswer = {
      user: req.user,
      answer,
      createdAt : new Date().toISOString(),
      updatedAt : new Date().toISOString()
    };

    // add this answer to our course content
    question.questionReplies.push(newAnswer);

    // if (req.body.avatar) {
    //   req.body.user = req.user;
    //   await updateProfilePicture(req, res, next);
    // }
    // if (req.body.name) {
    //   req.body.user = req.user;
    //   await updateUserInfo(req, res, next);
    // }
    // if (req.body.password) {
    //   req.body.user = req.user;
    //   await updatePassword(req, res, next);
    // }
 
    await course?.save();
    await redis.set(courseId, JSON.stringify(course), "Ex" , 604800)
    if (req.user?._id === question.user._id) {
      // create a notification

      await Notification.create({
        user: req.user?._id,
        title: "New Question Reply Recevied",
        message: `You have a new question reply in ${courseContent.title}`,
      });
    } else {
      const data = {
        name: question.user.name,
        title: courseContent.title,
      };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/question-reply.ejs"),
        data
      );
      try {
        await sendMail({
          email: question.user.email,
          subject: "Question Reply",
          template: "question-reply.ejs",
          data,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 400));
      }
    }
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// add review in course
const addReview = catchAsyncErrors(async (req, res, next) => {
  try {
    const userCourseList = req.user?.courses;
    const courseId = req.params.id;

    // check if courseId already exists in userCourseList based on _id

    const courseExists = userCourseList?.some(
      (course) => course._id.toString() === courseId.toString()
    );
    if (!courseExists) {
      return next(
        new ErrorHandler("You are not eligible to access this course", 404)
      );
    }
    const course = await Course.findById(courseId);
    const { review, rating } = req.body;

    const reviewData = {
      user: req.user,
      comment: review,
      rating,
    };
    course?.review.push(reviewData);

    let avg = 0;

    course?.review.forEach((rev) => {
      avg += rev.rating;
    });
    if (course) {
      course.ratings = avg / course.review.length; // 9 / 2 = 4.5 ratings
    }
    // if (req.body.avatar) {
    //   req.body.user = req.user;
    //   await updateProfilePicture(req, res, next);
    // }
    // if (req.body.name) {
    //   req.body.user = req.user;
    //   await updateUserInfo(req, res, next);
    // }
    // if (req.body.password) {
    //   req.body.user = req.user;
    //   await updatePassword(req, res, next);
    // }
    await course?.save();
    await redis.set(courseId, JSON.stringify(course), "Ex" , 604800)
    // create Notification
    await Notification.create({
      user: req.user?._id,
      title: "New Review Received",
      message: `${req.user?.name} has given a review in ${course?.name}`,
    });

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// add reply in  review
const addReplyReview = catchAsyncErrors(async (req, res, next) => {
  try {
    const { comment, reviewId, courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }
    const review = course?.review?.find(
      (rev) => rev._id.toString() === reviewId.toString()
    );

    if (!review) {
      return next(new ErrorHandler("Review not found", 404));
    }
    const replyData = {
      user: req.user,
      comment,
      createdAt : new Date().toISOString(),
      updatedAt : new Date().toISOString()
    };
    if (!review.commentReplies) {
      review.commentReplies = [];
    }
    review?.commentReplies.push(replyData);

    // if (req.body.avatar) {
    //   req.body.user = req.user;
    //   await updateProfilePicture(req, res, next);
    // }
    // if (req.body.name) {
    //   req.body.user = req.user;
    //   await updateUserInfo(req, res, next);
    // }
    // if (req.body.password) {
    //   req.body.user = req.user;
    //   await updatePassword(req, res, next);
    // }
 
    await course.save();
    await redis.set(courseId, JSON.stringify(course), "Ex" , 604800)
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get all courses --- only for admin
const getAllCoursesAdmin = catchAsyncErrors(async(req, res, next) => {
  try {
    getAllCoursesService(res)
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
})
const getAllCoursesInstructor = catchAsyncErrors(async(req, res, next) => {
  try {
    getAllInstructorCoursesService(res)
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
})
// Delete Course --- only for Admin
const deleteCourse = catchAsyncErrors(async(req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    console.log(id); // Debugging line
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }
    await course.deleteOne(); // Corrected line

    await redis.del(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });

  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


const generateVideoUrl = catchAsyncErrors(async (req, res, next) => {
  try {
    const { videoId } = req.body;
    if (!videoId) {
      return next(new ErrorHandler("videoId is required", 400));
    }

    const response = await axios.post(
      `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
      { ttl: 300 },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`
        }
      }
    );

    res.json(response.data);
    console.log(response.data);
  } catch (error) {
    console.error("Error generating video URL:", error);
    return next(new ErrorHandler(error.message, error.response?.status || 500));
  }
});



module.exports = {
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
  getAllCoursesByUser,
  getAllCoursesInstructor
};
