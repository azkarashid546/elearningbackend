const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const ContactUs = require("../models/contactus");
const ejs = require("ejs");
const path = require("path");
const sendMail = require("../utils/sendMail");

const contactUs = catchAsyncErrors(async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, country, message } = req.body;
    console.log(req.body);
    if (!firstName || !lastName || !email || !phone || !country || !message) {
      res.status(400);
      throw new Error("Please fill all fields");
    }
    //! this is not working so changed it on frontend from 1,2 to USA & Non-USA, change it as your requirement
    // let location = country =="1" ? "USA" : "Non-USA";
    // let cntry = (country)=>{
    //     if(country==1){
    //         return "USA"
    //     }
    //     if(country==2){
    //         return "Non-USA"
    //     }
    // }
    const contact = await ContactUs.create({
      firstName,
      lastName,
      email,
      phone,
      country,
      message,
    });
    if (contact) {
      try {
        //email send start
        const data = {
          name: `${firstName} ${lastName}`,
          email,
          phone,
          country,
          message,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/message-contact-us.ejs"),
          data
        );
        await sendMail({
          email: "azkarashid196@gmail.com", //you can use process.env.SMTP_MAIL
          subject: "Message received",
          template: "message-contact-us.ejs",
          data,
        });
        //email send end
        res
          .status(201)
          .json({ message: "Your message has been sent to admin" });
      } catch (error) {
        res
          .status(201)
          .json({ message: "Your message has been sent to admin" }); //! sending success response as this error will only for email and we will not let the user to know that email is sent or not, because message will also recive at admin panel
        console.log(error);
      }
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const getAllContacts = catchAsyncErrors(async(req, res, next) => {
    const contacts = await ContactUs.find().sort({ createdAt: -1 });
    res.status(200).json({ 
        success : true,
        contacts
    });

})

module.exports = {contactUs, getAllContacts};
