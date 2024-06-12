import mongoose, { model } from "mongoose";
import { genSalt, hash, compare } from "bcryptjs";
const { Schema } = mongoose;
require('dotenv').config();
import { sign } from 'jsonwebtoken';

const emailRegexPattern =
  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const CertificateSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'course',
    required: true,
  },
  certificate: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});
const CourseProgressSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
});
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value) {
          return emailRegexPattern.test(value);
        },
        message: "Please Enter a Valid Email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [{ courseId: String }],
    completedCourses: [CourseProgressSchema],
    certificates: [CertificateSchema],
  },
  { timestamps: true }
);


// Hash password before saving
UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);

    next();
  } catch (error) {
    next(error);
  }
});

// Sign access token
UserSchema.methods.SignAccessToken = function () {
  return sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
    expiresIn: "5m"
  });
}

// Sign refresh token
UserSchema.methods.SignRefreshToken = function () {
  return sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
    expiresIn: "3d"
  });
}

// Compare password 
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Method to check if a course is completed
UserSchema.methods.getOverallProgress = function () {
  const totalCourses = this.completedCourses.length;
  const completedCourses = this.completedCourses.filter(course => course.progress === 100);
  const overallProgress = (completedCourses.length / totalCourses) * 100;
  return overallProgress;
};

// Method to get course data completion progress
UserSchema.methods.getCourseDataCompletionProgress = function (courseId) {
  const course = this.completedCourses.find(
    (course) => course.courseId.toString() === courseId.toString()
  );
  if (!course) return 0;

  // Assuming each section/lesson has equal weight in progress calculation
  const totalSections = course.courseData.length;
  const completedSections = course.courseData.filter(
    (section) => section.completed
  ).length;
  const progress = (completedSections / totalSections) * 100;

  return progress;
};

const User = model("User", UserSchema);

export default User;


