import axios from 'axios';
import { showAlert } from './alert';

export const updateMe = async (data) => {
  try {
    const res = await axios({
      method: 'patch',
      url: '/api/v1/users/updateMe',
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Data updated Successfully');
      location.assign('/');
      window.setTimeout(() => {
        location.assign('/me');
      }, 500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const updatePassword = async (
  oldPassword,
  password,
  passwordConfirm
) => {
  try {
    const res = await axios({
      method: 'patch',
      url: '/api/v1/users/updatePassword',
      data: {
        oldPassword,
        password,
        passwordConfirm,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Password updated Successfully');
      location.assign('/');
      window.setTimeout(() => {
        location.assign('/me');
      }, 500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
