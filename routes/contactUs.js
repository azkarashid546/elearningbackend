const express = require("express");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const {contactUs, getAllContacts} = require("../controllers/contactUs");

const contactRouter = express.Router();

contactRouter.post("/contact-us",  contactUs)

contactRouter.get("/get-all-contacts",  isAuthenticated, authorizeRoles("admin"), getAllContacts)

module.exports = contactRouter