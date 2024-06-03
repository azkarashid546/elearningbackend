const express = require("express");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const {getUserAnalytics, getCourseAnalytics, getOrderAnalytics}= require("../controllers/analytics.generator");
const analyticsRouter = express.Router();

analyticsRouter.get(
  "/get-users-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserAnalytics
);

analyticsRouter.get(
    "/get-courses-analytics",
    isAuthenticated,
    authorizeRoles("admin"),
    getCourseAnalytics
  );

  analyticsRouter.get(
    "/get-order-analytics",
    isAuthenticated,
    authorizeRoles("admin"),
    getOrderAnalytics
  );

module.exports = analyticsRouter;
