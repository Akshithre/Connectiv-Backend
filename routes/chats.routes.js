const express = require('express');
const router = express.Router();
const { chatController } = require('../controllers/chats.controller');

// Define routes
router.post('/create', chatController.createChat);
router.get('/get-all', chatController.getAllChats);
router.get('/get-proposal/:proposalId', chatController.getChatsByProposal);
router.get('/get-investor/:investorId', chatController.getChatsByInvestor);
router.get('/get-by-proposal-investor/:proposalId/:investorId', chatController.getChatByProposalAndInvestor);
router.post('/add-message/proposal/:proposalId/investor/:investorId', chatController.addMessage);
router.delete('/delete/:chatId', chatController.deleteChat);

module.exports = router;