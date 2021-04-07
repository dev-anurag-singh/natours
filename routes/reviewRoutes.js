const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// Routes

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourandUserOnReview,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getAReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.validateUserOnReview,
    reviewController.updateAReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteAReview
  );

module.exports = router;
