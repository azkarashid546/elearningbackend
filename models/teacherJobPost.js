const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { Schema } = mongoose;
require("dotenv").config();
const jwt = require("jsonwebtoken");


const TeacherJobPostSchema = new Schema({
    title: {
        type: String,
    },
    category : {
       type : String
    },
    location: {
        type: String,
    },
    jobType: {
        type: String,
    },
    startDate: {
        type: Date,
    },
    description: {
        type: String,
    },
    responsibilities: [{type : String}],
    qualifications: [{type : String}],
    preferredQualifications: [{type : String}],
    benefits: [{type : String}],
    applicationProcess: {
        type: String,
    },
    deadline: {
        type: Date,
    },
    applicationLink: {
        type: String,
    },
    email: {
        type: String,
    },
    salary:{
        type : String
    },
    available : {
    type : Boolean,
    default : true
    },
})

const TeacherJobPost = mongoose.model("teacherjobpost", TeacherJobPostSchema);
module.exports = TeacherJobPost;


