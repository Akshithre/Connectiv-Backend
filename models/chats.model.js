const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Message sub-schema
const messageSchema = new Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['BusinessProposal', 'Investor']
  },
  message: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const chatSchema = new Schema({
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessProposal',
    required: true
  },
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor',
    required: true
  },
  all_chats: [messageSchema]
}, {
  timestamps: true
});

const ChatDetails = mongoose.model('Chat', chatSchema);

module.exports = ChatDetails;