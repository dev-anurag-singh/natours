const User = require('../models/userModel');
const catchAsync = require('../util/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../util/appError');
const { promisify } = require('util');
const Email = require('../util/email');
const crypto = require('crypto');

const jwtToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '90d',
  });
};

const createSendToken = (statusCode, req, res, id, user) => {
  const token = jwtToken(id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  if (process.env.NODE_env === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  return res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // Getting token and checking if its there

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to access', 401)
    );
  }

  // Validating the token

  const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Checking the user still exists

  const user = await User.findById(payload.id);

  if (!user) {
    return next(new AppError('Invalid user Id. Please Login again'), 401);
  }

  // Checking if the user has changed the password after token was issued

  if (user.passwordChangedAfter(payload.iat)) {
    return next(
      new AppError('Password has been modified. please log in again')
    );
  }

  // Grant access to the protected Route

  req.user = user;
  res.locals.user = user;

  next();
});

exports.loginState = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const payload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      const user = await User.findById(payload.id);

      if (!user) {
        return next();
      }

      if (user.passwordChangedAfter(payload.iat)) {
        return next();
      }

      res.locals.user = user;
      return next();
    } catch (err) {
      next();
    }
  }

  next();
};

exports.signUp = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
  } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
  });

  // Removing password Field from the Response

  newUser.password = undefined;

  // Sending Welcome Email
  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  // Sending Response
  createSendToken(201, req, res, newUser._id, newUser);
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to access this route', 403)
      );
    }
    next();
  };
};

exports.logOut = (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };

  res.cookie('jwt', 'Logged Out', cookieOptions);

  res.status(200).json({
    status: 'success',
  });
};

exports.signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check email & password exist
  if (!email || !password) {
    return next(new AppError('Please provide email & password', 400));
  }

  // Check if user exist and password correct

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('email or password incorrect', 401));
  }

  // if everything is ok send token and log user in

  // Sending Response
  createSendToken(201, req, res, user._id, user);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Finding user by email
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError('No user found with this email id', 404));

  // Generate the random reset token

  const resetToken = user.createpasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // Send token to users email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordToken();
    res.status(200).json({
      status: 'success',
      message: 'Reset Token send to email successful',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    next(
      new AppError(
        'There was an error sending email. please try again in some time'
      ),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on Token

  const resetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // Change password if User exists and token has not been expired yet

  if (!user) {
    return next(new AppError('Token is invalid or has been expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //Log the user in and send Jwt Token

  createSendToken(200, req, res, user._id);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from Collection

  const user = await User.findById(req.user._id).select('password');

  // Check the password provided by the User

  if (!(await user.comparePassword(req.body.oldPassword, user.password))) {
    return next(new AppError('Incorrect Password Provided', 400));
  }

  // If so update the password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  // Log the user In and Send token

  createSendToken(200, req, res, user._id);
});
