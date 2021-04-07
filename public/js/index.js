import '@babel/polyfill';
import { login, logOut } from './login';
import { displayMap } from './mapBox';
import { updateMe, updatePassword } from './updateUser';
import { bookTour } from './stripe';

// DOM

const mapLocations = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateMeForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const bookTourBtn = document.getElementById('book-tour');

if (mapLocations) {
  const locations = JSON.parse(mapLocations.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (updateMeForm) {
  updateMeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log(form);

    updateMe(form);
  });
}
if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    updatePassword(oldPassword, password, passwordConfirm);
  });
}
if (logOutBtn) {
  logOutBtn.addEventListener('click', (e) => {
    logOut();
  });
}

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
