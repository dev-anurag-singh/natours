const express = require('express');
const { loginState, protect } = require('../controllers/authController');
const viewsController = require('../controllers/viewsController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/me', protect, viewsController.getMe);

router.use(loginState);

router.get(
  '/',
  bookingController.bookTourCheckout,
  viewsController.getOverview
);

router.get('/tour/:slug', viewsController.getTour);

router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.get('/login', viewsController.login);

module.exports = router;
