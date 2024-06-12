const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("./user").default
const UserVideoHistorySchema = new Schema(
  {
    user: {
      userId: String
    },
    course: {
      courseId: String
    },

    watched: {
      type: Boolean,
      default: false,
    },
    certificate: {
      type: String // or Buffer, depending on how you store certificates
    }
  },
  { timestamps: true }
);

const UserVideoHistory = mongoose.model(
  "UserVideoHistory",
  UserVideoHistorySchema
);
module.exports = UserVideoHistory;
