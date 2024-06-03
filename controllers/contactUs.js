const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const ErrorHandler = require("../utils/ErrorHandler");

const ContactUs = require("../models/contactus");
const redis = require("../utils/redis");
const { default: mongoose } = require("mongoose");
const sendMail = require("../utils/sendMail");
const ejs = require("ejs");
const path = require("path");
const Notification = require("../models/notification");
const axios = require("axios");
