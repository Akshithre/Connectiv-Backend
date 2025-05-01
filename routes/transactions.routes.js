const express = require('express');
const router = express.Router();
const { transactionController } = require('../controllers/transactions.controller');

// Define routes
router.post('/create', transactionController.createTransaction);
router.post('/get-all', transactionController.getAllTransactions);
router.get('/get-proposal/:proposalId', transactionController.getTransactionsByProposal);
router.get('/get-transaction/:transactionId', transactionController.getTransactionById);
router.post('/update-transaction', transactionController.updateTransaction);
router.delete('/delete', transactionController.deleteTransaction);
router.get('/get-investor_proposal/:investorId', transactionController.getTransactionsByInvestor);
router.get('/get-by-proposal-investor/:proposalId/:investorId', transactionController.getTransactionByProposalAndInvestor);
router.post('/update/proposal/:proposalId/investor/:investorId', transactionController.updateTransactionByProposalAndInvestor);
module.exports = router;