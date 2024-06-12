const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const ErrorMiddleware = require('./middleware/error');
const userRouter = require('./routes/user');
const courseRouter = require('./routes/course');
const orderRouter = require('./routes/order');
const notificationRouter = require('./routes/notification');
const analyticsRouter = require('./routes/analytics');
const cloudinary = require('cloudinary').v2;
const layoutRouter = require('./routes/layout');
const passport = require('passport');
const http = require('http');
const initSocketServer = require('./socketServer');
const uploadCertificateRouter = require('./routes/uploadCertifcate');
const contactRouter = require('./routes/contactUs');
const chatRouter = require('./routes/chatgpt');

const app = express();

// connectToMongo();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 31536000000,
    },
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

app.use(
  cors()
);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳')
})

app.use(
  '/api/v1',
  userRouter,
  courseRouter,
  orderRouter,
  notificationRouter,
  analyticsRouter,
  layoutRouter,
  uploadCertificateRouter,
  contactRouter,
  chatRouter
);

app.get('/test-cors', (req, res) => {
  res.send('CORS is working!');
});


app.use(ErrorMiddleware);

const server = http.createServer(app);

initSocketServer(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
