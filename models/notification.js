const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { Schema } = mongoose;
require("dotenv").config();
const jwt = require("jsonwebtoken");



const NotificationSchema = new Schema({
    title : {
        type : String,
        required : true
    },
    message : {
        type : String,
        required : true
    },
    status : {
        type : String,
        required : true,
        default : "unread"
    }
  },{timestamps : true});


  const Notification = mongoose.model("notification", NotificationSchema);
  module.exports = Notification;