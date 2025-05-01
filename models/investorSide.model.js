const mongoose = require('mongoose');
const Schema = mongoose.Schema;

  const ownerPaymentSchema = new Schema({
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProposal',
      required: true
    },
    
    payment_done_from_owner_status:{
        type: Boolean,
        default: false
      },
    
  });
const investorSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    mobileNo: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    entity_name:{
        type: String,
        trim:true
    },
    entity_designation:{
        type: String,
        trim:true
    },
    interested_industries: {
        type: [String], // Defines an array of strings
        trim: true // This option is not applicable directly to arrays
    },
    investment_size_pref_min:{
        type: String, 
        trim: true 
    },
    investment_size_pref_max:{
        type: String, 
        trim: true 
    },
    open_to: {
        type: [String], // Defines an array of strings
        trim: true // This option is not applicable directly to arrays
    },
    Location: {
        type: [String],
        
        trim: true
    },
    industries: {
        type: [String],
       
        trim: true
    },
    no_deals: {
        type: String,
       
        trim: true
    },
    investment_size_his_min:{
        type: String, 
        trim: true 
    },
    investment_size_his_max:{
        type: String, 
        trim: true 
    },
    prof_desc: {
        type: String,
       
        trim: true
    },
    expectations: {
        type: String,
       
        trim: true
    },
    payment_done_from_owner: [ownerPaymentSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Investor', investorSchema);