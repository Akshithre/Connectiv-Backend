// In models/transactions.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessProposal',
    required: true
  },
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor'
  },
  contact_business_info: {
    type: String,
    trim: true
  },
  terms_of_investor: {
    type: Boolean,
    required: true,
    default: false
  },
  accept_or_reject: {
    type: String,
    trim: true,
    enum: ['accept', 'reject'],
    default: null
  },
  business_name: {
    type: String,
    trim: true
  },
  business_version: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const TransactionDetails = mongoose.model('Transaction', transactionSchema);

module.exports = TransactionDetails;