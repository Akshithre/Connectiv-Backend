const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  email:{
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['investor', 'business_owner','admin']
  },
  password: {
    type: String,
    required: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);