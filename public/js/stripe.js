import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51IdU85SEYYt4RG19lakhz0Emajfnz2hhbmm55sMhc7wbxI9Ns4td0ar3EUT4I49pzIyDHfql8D5McN1aoySBCk6S00m08I4XAS'
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios(`/api/v1/bookings/check-out-window/${tourId}`);

    // Checkout gateway
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
