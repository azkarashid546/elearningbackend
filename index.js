const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectToMongo = require("./utils/db");
const ErrorMiddleware = require("./middleware/error");
const router = require('./routes/user');
const CourseRouter = require("./routes/course");
const orderRouter = require("./routes/order");
const notificationRouter = require("./routes/notification");
const analyticsRouter = require("./routes/analytics");
const cloudinary = require("cloudinary").v2; // Added .v2
const layoutRouter = require('./routes/layout');
const passport = require("passport");
const http = require("http");
const initSocketServer = require('./socketServer');
const UploadCertifcateRouter = require('./routes/uploadCertifcate');
const contactRouter = require('./routes/contactUs');

const app = express();

connectToMongo();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // set to true in production
        httpOnly: true,
        maxAge: 31536000000, // 1 year
    },
}));

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use(cors({
    origin: '*', // or your front-end URL
    credentials: true,
}));

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY
});

// Available Routes
app.use('/api/v1', router, CourseRouter, orderRouter, notificationRouter, analyticsRouter, layoutRouter, UploadCertifcateRouter, contactRouter);

app.use(ErrorMiddleware);

const server = http.createServer(app);

initSocketServer(server);

server.listen(process.env.PORT, () => {
    console.log(`Server is connected on port ${process.env.PORT}`);
});