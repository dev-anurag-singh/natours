const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const catchAsync = require('../util/catchAsync');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide a email id'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email id'],
  },
  role: {
    type: String,
    emum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Please Provide a Password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a confirm password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'passwords should be same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Document middleware to Hash Password

userSchema.pre('save', async function (next) {
  // Checking if password was modified
  if (!this.isModified('password')) {
    return;
  }

  // Hashing password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Removing the password confirm field

  this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// Query Middleware to remove inactive users from document

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// Instance method to Check password

userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (Timestamp) {
  if (this.passwordChangedAt) {
    const passwordChangeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return Timestamp < passwordChangeTimestamp;
  }

  return false;
};

userSchema.methods.createpasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
