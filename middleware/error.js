const ErrorHandler = require("../utils/ErrorHandler");


module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.message = err.message || "Internal Server Error";

    // Wrong Mongodb Id error
    if(err.name === 'CastError'){
        const message = `Resource Not Found. Invalid ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    //Dublicate Key Error 
    if(err.code === 12000){
        const message = `Dublicate ${Object.keys(err.keyValue)} extend`;
        err = new ErrorHandler(message, 400)
    }

    // wrong jwt Error
    if(err.name === 'JsonWebTokenError'){
        const message = `Json web token is invalid, try again`
        err = new ErrorHandler(message, 400)
    }

    // JWT Expired Error
    if(err.name === "TokenExpiredError"){
        const message = `Json Web Token is Expired, try again`
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
        sucess : false,
        message : err.message
    })
}