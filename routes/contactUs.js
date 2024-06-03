const express = require("express");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const contact = require("../controllers/contactUs");

const contactRouter = express.Router();

contactRouter.post("/contact-us", contact)


module.exports = contactRouter