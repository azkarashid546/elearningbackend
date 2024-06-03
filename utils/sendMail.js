const nodemailer = require('nodemailer')

const ejs = require("ejs")
const  path = require("path")

require("dotenv").config()

const sendMail = async(options, user) => {
  const transporter = nodemailer.createTransport({
    host : process.env.SMTP_HOST,
    port : parseInt(process.env.SMTP_PORT || '587'),
    service : process.env.SMTP_SERVICE,
    auth : {
        user : process.env.SMTP_MAIL,
        pass : process.env.SMTP_PASSWORD
    }

  })
  const {email, template, data,  subject} = options;
  
  const templatePath = path.join(__dirname, "../mails", template)

  const html = await ejs.renderFile(templatePath, data)
  
  const mailOptions = {
    from : process.env.SMTP_MAIL,
    to : email,
    subject,
    html
  }
  await transporter.sendMail(mailOptions)


}

module.exports = sendMail;

