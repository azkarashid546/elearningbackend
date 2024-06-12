const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    user: Object,
    rating: {
      type: Number,
      default: 0,
    },
    comment: String,
    commentReplies: [Object],
  },
  { timestamps: true }
);

const LinksSchema = new Schema({
  title: String,
  url: String,
});

const CommentSchema = new Schema(
  {
    user: Object,
    question: String,
   
    questionReplies: [Object],
  },
  { timestamps: true }
);

const CourseDataSchema = new Schema({
  vedioUrl: String, 
  title: String,
  vedioSection: String, 
  description: String,
  vedioLength: Number,
  videoPlayer: String,
  links: [LinksSchema],
  suggestion: String,
  questions: [CommentSchema],
});

const CourseSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    categories: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedPrice: { type: Number },
    thumbnail: {
      public_id: { type: String },
      url: { type: String },
    },
    tags: { type: String, required: true },
    level: { type: String, required: true },
    demoUrl: { type: String, required: true },
    benefits: [{ title: String }],
    prerequisities: [{ title: String }],
    review: [ReviewSchema],
    courseData: [CourseDataSchema], // Ensure this key matches the frontend data
    ratings: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
    instructor: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Course = mongoose.model("course", CourseSchema);
module.exports = Course;
