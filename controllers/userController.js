const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const factory = require('./handleFactory');

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// User Route Handlers
exports.createUser = (req, res, next) => {
  next(
    new AppError(
      'This route is not yet defined. please use /signup to create a new user',
      500
    )
  );
};
exports.getAllUsers = factory.getAll(User);
exports.getAUser = factory.getOne(User);
exports.updateAUser = factory.updateOne(User);
exports.deleteAUser = factory.deleteOne(User);

exports.updateMe = async (req, res, next) => {
  // Filter unwanted Fields

  const filterBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filterBody.photo = req.file.filename;
  }

  // Update the user

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
    new: true,
  });

  // Send Response

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
  });
});
