const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingsModel');
const Tour = require('../models/tourModel');
const catchAsync = require('../util/catchAsync');
const factory = require('./handleFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tour.id}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100 * 74,
        currency: 'inr',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.bookTourCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create(req.query);

  res.redirect(`${req.protocol}://${req.get('host')}/`);
});

exports.getAllBookings = factory.getAll(Booking);
exports.getABooking = factory.getOne(Booking);
exports.updateABooking = factory.updateOne(Booking);
exports.deleteABooking = factory.deleteOne(Booking);
exports.createABooking = factory.createOne(Booking);