const express = require('express');
const router = express.Router();
const { investorController } = require('../controllers/investorSide.controller');

// Basic CRUD operations
router.post('/create', investorController.createInvestorDetails);
router.post('/update', investorController.updateInvestorDetails);
router.get('/get-investor/:investorId', investorController.getInvestorDetailsByID);
router.delete('/delete', investorController.deleteInvestorDetails);
router.post('/get-all', investorController.getAllInvestors);
router.post('/update-proposal-payment-status', investorController.updatePaymentStatus);
module.exports = router;