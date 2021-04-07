const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/check-out-window/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.createABooking
  );
router
  .route('/:id')
  .get(bookingController.getABooking)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.updateABooking
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.deleteABooking
  );
module.exports = router;
