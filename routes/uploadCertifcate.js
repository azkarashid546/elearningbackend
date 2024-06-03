const express = require('express');
const { uploadCertificate } = require('../controllers/uploadCertifcate');
const upload = require('../middleware/upload');
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

const UploadCertifcateRouter = express.Router();

UploadCertifcateRouter.post('/upload-certificate', isAuthenticated,  authorizeRoles("instructor"), upload.single('certificate'), uploadCertificate);

module.exports = UploadCertifcateRouter;