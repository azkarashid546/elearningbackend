const mongoose = require("mongoose");
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: "unread", 
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
  },
});

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;