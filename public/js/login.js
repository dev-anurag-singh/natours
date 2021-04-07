import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signIn',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in Successfully ! ');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logOut = async () => {
  try {
    const res = await axios.get('/api/v1/users/logOut');
    if (res.data.status === 'success') location.assign('/login');
  } catch (err) {
    alert('Something went wrong. Please try again');
  }
};
