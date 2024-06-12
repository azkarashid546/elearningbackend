const express = require("express");
const app = express()
const cors = require("cors")
const cookieParser = require("cookie-parser");
require("dotenv").config()



// body parser
app.use(express.json({ limit: "50mb" }))

//cookie parser
app.use(cookieParser())

// cors
app.use(cors({
    origin: '*',
}))

// testing api

app.get("/get", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Api is working"
    })
})

// unknown routes
app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
}) 