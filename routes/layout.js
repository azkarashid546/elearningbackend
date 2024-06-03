const express = require("express");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const { createLayout, editLayout, getLayoutByType } = require("../controllers/layout");

const layoutRouter = express.Router();

layoutRouter.post("/create-layout", isAuthenticated, authorizeRoles("admin"), createLayout)

layoutRouter.put("/edit-layout", isAuthenticated, authorizeRoles("admin"),editLayout)

layoutRouter.get("/get-layout/:type", getLayoutByType)

module.exports = layoutRouter