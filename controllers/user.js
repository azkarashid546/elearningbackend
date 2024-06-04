const User = require("../models/user");

const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
// const createActivationToken = require("./createActivationToken");
const ejs = require("ejs");
const path = require("path");
const sendMail = require("../utils/sendMail");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
const {
  sendToken,
  accessTokenOptions,
  refreshTokenOptions,
} = require("../utils/jwt");
const redis = require("../utils/redis");
const {
  getUserById,
  getAllUsersService,
  updateUserRoleService,
} = require("../services/user");
const Course = require("../models/course");

const registerUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password, role, isVerified } = req.body;
    let isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
      // return res
      //   .status(400)
      //   .json({ success, error: "Sorry a user with this email already exists" });
      return next(new ErrorHandler("Email Already Exists", 400));
    }
    const user = {
      name,
      email,
      password,
      role,
      isVerified,
    };
    const activationToken = createActivationToken(user);
    console.log("Activation token: ", activationToken);
 
    const activationCode = activationToken.activationCode;
    console.log("Activation code: ", activationCode);
    const data = { user: user.name, activationCode };
   
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/activation-mail.ejs"),
      data
    );

    try {
      await sendMail({
        email: user.email,
        subject: "Active your Account",
        template: "activation-mail.ejs",
        data,
      });
      const responseData = {
        success: true,
        message: `Please check your email: ${user.email} to activation your account!`,
        activationToken: activationToken.token,
      };
      
      res.json(responseData);
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
    // const newUser = await User.create(req.body);
    // res.status(201).json({
    //   success: true,
    //   user: newUser,
    // });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const createActivationToken = (user) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET,
    {
      expiresIn: "5m",
    }
  );

 

  return { token, activationCode };
};

const activateUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { token, activationCode } = req.body;
    console.log("Activate user request received", req.body);
  

    const newUser = jwt.verify(token, process.env.ACTIVATION_SECRET);
    if (newUser.activationCode !== activationCode) {
      return next(new ErrorHandler("Invalid Activation Code", 400));
    }
    const { name, email, password, role, isVerified } = newUser.user;
    const existUser = await User.findOne({ email });

    if (existUser) {
      return next(new ErrorHandler("Email already Exists", 400));
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      isVerified: true
    });
    const responseData = {
      sucess: true,
      user: user,
    };
    
    res.json(responseData);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const loginUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(
        new ErrorHandler("Please enter your email and password", 400)
      );
    }
    const user = await User.findOne({ email }).select("+password");
    // console.log("user when logging ",user)   //! .select("+password"); it will also send password but we will never send password to the frontend
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    sendToken(user, 200, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const logoutUser = catchAsyncErrors(async (req, res, next) => {
  try {
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });
    const userId = req.user?._id || "";

    console.log(req.user);

    // Check if user ID is present
    if (!userId) {
      return next(new ErrorHandler("User ID not found", 400));
    }

    redis.del(userId);

    res.status(200).json({
      success: true,
      message: "Logout Successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const updateAccessToken = catchAsyncErrors(async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    console.log(refresh_token);

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);
    if (!decoded) {
      throw new ErrorHandler("Could not Refresh Token", 400);
    }

    const session = await redis.get(decoded.id);
    if (!session) {
      throw new ErrorHandler("Please Login to access this resource", 400);
    }

    const user = JSON.parse(session);

    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
      expiresIn: "5m",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
      expiresIn: "3d",
    });

    req.user = user;
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    await redis.set(user._id, JSON.stringify(user), "EX", 604800);

    next();
  } catch (error) {
    next(error); // Forward the error to the error handling middleware
  }
});

// get user info
const getUserInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log(req.user)
    const userId = req.user?._id;
    getUserById(userId, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// social auth
const socialAuth = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      const newUser = await User.create({ email, name, avatar });
      sendToken(newUser, 200, res);
    } else {
      sendToken(user, 200, res);
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user info

const updateUserInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (name && user) {
      user.name = name;
    }
    await user?.save();

    // const courses = await Course.find({
    //   "courseData.questions.user": userId,
    // });
    // if (courses) {
    //   courses.forEach((course) => {
    //     course.courseData.forEach((section) => {
    //       if (section.questions) {
    //         section.questions.forEach((question) => {
    //           if (question.user._id.toString() === userId.toString()) {
    //             question.user.name = name;
    //           }
    //         });
    //       }
    //     });
    //     course.save();
    //   });
    // }

    await redis.set(userId, JSON.stringify(user));

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user password

const updatePassword = catchAsyncErrors(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler("Please enter old and new password", 400));
    }
    const user = await User.findById(req.user?._id).select("+password");
    if (user?.password === undefined) {
      return next(new ErrorHandler("Invalid User", 400));
    }
    const isPasswordMatch = await user?.comparePassword(oldPassword);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid old password", 400));
    }
    user.password = newPassword;
    await user.save();
    await redis.set(req.user?._id, JSON.stringify(user));

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update Profile Picture
const updateProfilePicture = catchAsyncErrors(async (req, res, next) => {
  try {
    const { avatar } = req.body;
    const userId = req.user?._id;
    const user = await User.findById(userId);
    // if user have one avatar then call this if
    if (avatar && user) {
      if (user?.avatar.public_id) {
        // first delete the old image
        await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      } else {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
    }
    await user?.save();
    await redis.set(userId, JSON.stringify(user));
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get all users --- only for admin
const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  try {
    const users = await getAllUsersService();
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
const getAllUsersInstructor = catchAsyncErrors(async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).populate('completedCourses');

    // Retrieve all course IDs dynamically
    const courses = await Course.find({}, '_id');
    const courseIds = courses.map(course => course._id);

    const usersWithCourses = users.map(user => {
      const completedCourses = courseIds.map(courseId => ({
        courseId,
        completed: user.completedCourses.some(course => course._id.equals(courseId))
      }));

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        specificCourses: completedCourses,
      };
    });

    return res.status(200).json({
      success: true,
      users: usersWithCourses,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});



// update user role ---- only for Admin
const updateUserRole = catchAsyncErrors(async (req, res, next) => {
  try {
    const { role, email } = req.body;
    console.log(
      `Received request to update role for email: ${email} to role: ${role}`
    );

    if (!role) {
      return next(new ErrorHandler("Role is required", 400));
    }

    console.log(
      `Received request to update role for email: ${email} to role: ${role}`
    );

    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
      const id = isUserExist._id;
      console.log(`User found with id: ${id}. Proceeding to update role...`);

      const updatedUser = await updateUserRoleService(id, role);
      console.log(`User role updated successfully:`, updatedUser);

      return res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
      });
    } else {
      console.log("User not found");
      return next(new ErrorHandler("User not found", 400));
    }
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

// Delete User --- only for Admin
const deleteUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    await user.deleteOne({ id });

    await redis.del(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const updateCourseProgress = async (req, res) => {
  try {
    // Extract courseId, videoId, and progress from the request body
    const { courseId, vedioUrl, progress } = req.body;

    // Find the course by courseId
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Update the progress of the video with the specified videoId
    const videoIndex = course.videos.findIndex(video => video._id === vedioUrl);
    if (videoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Video not found in course' });
    }

    // Update the progress of the video
    course.videos[videoIndex].progress = progress;

    // Save the updated course
    await course.save();

    // Send a success response
    res.status(200).json({ success: true, message: 'Course progress updated successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error updating course progress:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
const getCourseDataCompletionProgress = (userId, courseId) => {
  return User.findById(userId)
    .then(user => {
      if (!user) {
        throw new Error('User not found');
      }
      return user.getCourseDataCompletionProgress(courseId);
    })
    .catch(error => {
      throw new Error(error.message);
    });
};

// Example usage in a controller function
// Example usage in a controller function
const getUserCourseDataCompletionProgress = async (req, res, next) => {
  try {
    const userId = req.query.userId; // Extract user ID from query parameters
    const courseId = req.query.courseId; // Extract course ID from query parameters

    if (!userId || !courseId) {
      throw new Error('User ID or Course ID not provided');
    }

    // Query the database or perform necessary operations to get completion progress
    const completionProgress = await getCourseDataCompletionProgress(userId, courseId);

    res.status(200).json({ success: true, completionProgress });
  } catch (error) {
    next(error); // Forward the error to the error handling middleware
  }
};



module.exports = {
  registerUser,
  createActivationToken,
  activateUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateProfilePicture,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserCourseDataCompletionProgress,
  getAllUsersInstructor,
  updateCourseProgress,
};
