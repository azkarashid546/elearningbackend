const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { Schema } = mongoose;
require("dotenv").config();
const jwt = require("jsonwebtoken");



const OrderSchema = new Schema({
    instructor: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
    },
    courseId : {
        type : String,
        required : true
    },
    userId : {
        type : String,
        required : true
    },
    payment_info : {
        type : Object,

    }
  },{timestamps : true});


  const Order = mongoose.model("order", OrderSchema);
  module.exports = Order;