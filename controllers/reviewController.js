const catchAsync = require('../util/catchAsync');
const Review = require('../models/reviewsModel');
const factory = require('./handleFactory');
const AppError = require('../util/appError');

exports.setTourandUserOnReview = (req, res, next) => {
  // Allow nested route
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.validateUserOnReview = async (req, res, next) => {
  const UserOnReview = await Review.findById(req.params.id);
  if (!(req.user.id == UserOnReview.user._id)) {
    return next(
      new AppError('This Review does not belong to current user .', 401)
    );
  }
  next();
};

// Route Handelers

exports.getAllReviews = factory.getAll(Review);
exports.getAReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateAReview = factory.updateOne(Review);
exports.deleteAReview = factory.deleteOne(Review);
