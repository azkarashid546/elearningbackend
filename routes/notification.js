const express = require("express");
const { authorizeRoles, isAuthenticated } = require("../middleware/auth");
const {getNotifications, updateNotification} = require("../controllers/notification");

const notificationRouter = express.Router();

notificationRouter.get(
  "/get-all-notifications",

  isAuthenticated,
  authorizeRoles("admin"),
  getNotifications
);

notificationRouter.put(
    "/update-notification/:id",
  
    isAuthenticated,
    authorizeRoles("admin"),
    updateNotification
  );
  notificationRouter.get(
    "/get-all-notifications-instructor",
  
    isAuthenticated,
    authorizeRoles("instructor"),
    getNotifications
  );
  
  notificationRouter.put(
      "/update-notification-instructor/:id",
    
      isAuthenticated,
      authorizeRoles("instructor"),
      updateNotification
    );

module.exports = notificationRouter