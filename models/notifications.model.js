const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    trim: true 
  },
  message: { 
    type: String,
    trim: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

const NotificationDetails = mongoose.model('Notification', notificationSchema);

module.exports = NotificationDetails;