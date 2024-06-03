const Notification = require("../models/notification")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")
const ErrorHandler = require("../utils/ErrorHandler")
const cron = require("node-cron")


// get All notifications ------ only admin
const getNotifications = catchAsyncErrors(async(req, res, next) => {
    try {
        const notifications = await Notification.find().sort({createdAt : -1})
        res.status(200).json({
            success: true,
            notifications
        })

    } catch (error) {
        return next(new ErrorHandler(error.message, 500))
    }
})


// update Notification status ------- only admin
const updateNotification = catchAsyncErrors(async(req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id)
        if(!notification) {
            return next(new ErrorHandler("Notification not found", 404))
        }
        else{
            notification?.status ?  notification.status = "read" : notification?.status;
        }
       
        const notifications = await Notification.find().sort({createdAt : -1})
        await notification.save()
        res.status(200).json({
            success: true,
            notifications
            })

    } catch (error) {
        return next(new ErrorHandler(error.message, 500))
    }
})

// delete notification ------ only admin
cron.schedule("0 0 0 * * *" , async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await Notification.deleteMany({
        status : "read",
        createdAt : {
            $lte : thirtyDaysAgo
        }
    })
    console.log("Deleted read notification")
})
module.exports = {getNotifications, updateNotification}
