const express = require("express");
const orderRouter = express.Router();
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const { createOrder, getAllOrders, sendStripePublishableKey, newPayment, getUserOrdersForCourse, getAllOrdersInstructor } = require("../controllers/order");


orderRouter.post("/create-order", isAuthenticated, createOrder);

orderRouter.get(
  "/get-orders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);

orderRouter.get(
  "/get-all-orders-instructor",
  isAuthenticated,
  authorizeRoles("instructor"),
  getAllOrdersInstructor
);


orderRouter.get(
  "/get-user-order-details",
  isAuthenticated,
  getUserOrdersForCourse,
 
);
orderRouter.get("/payment/stripepublishablekey", sendStripePublishableKey)





orderRouter.post("/payment", isAuthenticated, newPayment)

module.exports = orderRouter;
