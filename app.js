const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
app.enable('trust proxy');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewsRouter = require('./routes/viewsRoutes');

const AppError = require('./util/appError');
const globalErrorHandler = require('./controllers/errorController');
const { tourCheckOut } = require('./controllers/bookingController');

app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));

// Allow access to * origin
app.use(cors());

// Allow complex requests from * origin
app.options('*', cors());

// Serving Static Files

app.use(express.static(path.join(__dirname, 'public')));

// Req limiting middleware from same IP

const limitter = rateLimit({
  max: 50,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request please try again in sometime',
});

app.use('/api', limitter);

// Using helmet to Set Http headers

app.use(helmet());

app.post(
  '/webhookCheckout',
  express.raw({ type: 'application/json' }),
  tourCheckOut
);

// Using parser to access the body

app.use(express.json());

// Using Cookie-parser to access the cookie

app.use(cookieParser());

// Logging Middleware

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Data sanitization against NoSQL attacks

app.use(mongoSanitize());

// Using XSS to Prevent XSS Attacks

app.use(xss());

// app.use((req, res, next) => {
//   console.log(req.cookies.jwt);
//   next();
// });

app.use(compression());

// Routes
app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Route for unmached Request

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
