const catchAsyncErrors = require("./catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/user").default;
const redis = require("../utils/redis");
const { updateAccessToken } = require("../controllers/user");
require("dotenv").config();

// Authenticated User
const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const access_token = req.cookies.access_token;
  if (!access_token) {
    return next(new ErrorHandler("Please login to access this resource", 400));
  }

  try {
    const decoded = jwt.decode(access_token);
    if (!decoded) {
      return next(new ErrorHandler("Access Token is not valid", 400));
    }

    if (decoded.exp && decoded.exp <= Date.now() / 1000) {
      try {
        await updateAccessToken(req, res, next);
      } catch (error) {
        return next(error);
      }
    } else {
      const user = await redis.get(decoded.id);
      if (!user) {
        return next(
          new ErrorHandler("Please login to access this resource", 400)
        );
      }

      req.user = JSON.parse(user);
      next();
    }
  } catch (error) {
    return next(new ErrorHandler("Invalid access token", 400));
  }
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || ""; // Ensure user.role is correctly accessed

    if (!req.user) {
      return next(new ErrorHandler("Unauthorized access", 401));
    }

    if (!roles.includes(userRole)) {
      return next(
        new ErrorHandler(
          `Role: ${userRole} is not allowed to access this resource`,
          403
        )
      );
    }

    next();
  };
};


// const adminRole = authorizeRoles(["admin"]);

module.exports = { isAuthenticated, authorizeRoles };
