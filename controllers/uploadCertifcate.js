const User = require('../models/user');
const cloudinary = require("cloudinary"); // Importing v2 of Cloudinary
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");

const uploadCertificate = catchAsyncErrors(async (req, res, next) => {
    const { userId, courseId } = req.body;
    const certificate = req.file;

    try {
        // Check if file exists
        if (!certificate) {
            throw new ErrorHandler('Certificate file is missing', 400);
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorHandler('User not found', 404);
        }

        // Upload certificate to Cloudinary
        const result = await cloudinary.v2.uploader.upload(certificate.path, {
            resource_type: 'raw',
            folder: 'certificates'
        });
        console.log(result)
        // Add certificate URL to user's profile
        user.certificates.push({ courseId, certificate: result.secure_url });
        await user.save();

        res.status(200).json({ success: true, message: 'Certificate uploaded successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging purposes
        next(error); // Pass the error to the error handling middleware
    }
});

module.exports = { uploadCertificate };
