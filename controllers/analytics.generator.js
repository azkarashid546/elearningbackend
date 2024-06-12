const ErrorHandler = require("../utils/ErrorHandler")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")
const User = require("../models/user").default
const { generateLast12MonthsData } = require("../utils/analytics.generator");
const Course = require("../models/course")
const Order = require("../models/order")


// get user analytics ---- only for admin
const getUserAnalytics = catchAsyncErrors(async (req, res, next) => {

    try {
        const users = await generateLast12MonthsData(User)
        res.status(200).json({
            success: true,
            users
        })

    } catch (error) {
        return next(new ErrorHandler(error.message, 500))
    }

})

const getCourseAnalytics = catchAsyncErrors(async (req, res, next) => {

    try {
        const courses = await generateLast12MonthsData(Course)
        res.status(200).json({
            success: true,
            courses
        })

    } catch (error) {
        return next(new ErrorHandler(error.message, 500))
    }

})


const getOrderAnalytics = catchAsyncErrors(async (req, res, next) => {

    try {
        const orders = await generateLast12MonthsData(Order)
        res.status(200).json({
            success: true,
            orders
        })

    } catch (error) {
        return next(new ErrorHandler(error.message, 500))
    }

})

module.exports = { getUserAnalytics, getCourseAnalytics, getOrderAnalytics }