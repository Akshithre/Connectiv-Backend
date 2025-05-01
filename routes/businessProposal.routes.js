const express = require('express');
const router = express.Router();
const { businessProposalController } = require('../controllers/businessProposal.controller');

// Basic CRUD operations
router.post('/create', businessProposalController.createProposal);
router.post('/update-valuation', businessProposalController.updateValuation);
router.post('/get-all', businessProposalController.getAllProposals);
router.get('/get-proposal/:proposalId', businessProposalController.getProposalById);
router.post('/create-valuation', businessProposalController.createValuation);
router.post('/update-proposal',businessProposalController.updateProposal);
// Delete proposal
router.delete('/delete', businessProposalController.deleteProposal);

router.get('/payment-status/:proposalId', businessProposalController.getPaymentStatus);

router.delete('/delete-valuation', businessProposalController.deleteValuation);

router.post('/update-advisor', businessProposalController.updateAdvisorDetails);
router.post('/get-advisor', businessProposalController.getAdvisorDetails);
// Slide 0 routes
router.post('/update-slide0', businessProposalController.updateSlide0);
router.get('/get-slide0/:proposalId', businessProposalController.getSlide0);

// Slide 1 routes
router.post('/update-slide1', businessProposalController.updateSlide1);
router.get('/get-slide1/:proposalId', businessProposalController.getSlide1);

// Slide 2 routes
router.post('/update-slide2', businessProposalController.updateSlide2);
router.get('/get-slide2/:proposalId', businessProposalController.getSlide2);

// Slide 3 routes
router.post('/update-slide3', businessProposalController.updateSlide3);
router.get('/get-slide3/:proposalId', businessProposalController.getSlide3);

// Historical Performance routes
router.post('/update-slide4', businessProposalController.updateslide4);
router.get('/get-slide4/:proposalId', businessProposalController.getslide4);

// Slide 4 routes
router.post('/update-slide5', businessProposalController.updateslide5);
router.get('/get-slide5/:proposalId', businessProposalController.getslide5);

// Slide 5 routes
router.post('/update-slide6', businessProposalController.updateslide6);
router.get('/get-slide6/:proposalId', businessProposalController.getslide6);

// Slide 6 routes
router.post('/update-slide7', businessProposalController.updateslide7);
router.get('/get-slide7/:proposalId', businessProposalController.getslide7);

// Slide 7 routes
router.post('/update-slide8', businessProposalController.updateslide8);
router.get('/get-slide8/:proposalId', businessProposalController.getslide8);

// Slide 8 routes
router.post('/update-slide9', businessProposalController.updateslide9);
router.get('/get-slide9/:proposalId', businessProposalController.getslide9);

// Slide 9 routes
router.post('/update-slide10', businessProposalController.updateslide10);
router.get('/get-slide10/:proposalId', businessProposalController.getslide10);

// Slide 10 routes
router.post('/update-slide11', businessProposalController.updateslide11);
router.get('/get-slide11/:proposalId', businessProposalController.getslide11);

// Slide 11 routes
router.post('/update-slide12', businessProposalController.updateslide12);
router.get('/get-slide12/:proposalId', businessProposalController.getslide12);

// Slide 12 routes
router.post('/update-slide13', businessProposalController.updateslide13);
router.get('/get-slide13/:proposalId', businessProposalController.getslide13);

// Slide 13 routes
router.post('/update-slide14', businessProposalController.updateslide14);
router.get('/get-slide14/:proposalId', businessProposalController.getslide14);
// router.get('/get-slide1/:proposalId', businessProposalController.getSlide1);

// In businessProposal.routes.js
router.post('/create-investor-connection', businessProposalController.createInvestorConnection);
router.get('/get-investor-connections/:proposalId', businessProposalController.getInvestorConnections);

router.post('/request-hold', businessProposalController.requestHold);
router.post('/update-status', businessProposalController.updateStatus);
router.post('/update-status', businessProposalController.updateBusinessStatus);

// In businessProposal.routes.js
router.get('/get-all-admin', businessProposalController.getAllProposalsAdmin);

router.post('/clear-rejection-reason', businessProposalController.clearRejectionReason);

router.post('/request-hold', businessProposalController.requestHold);
router.get('/get-hold-requests', businessProposalController.getHoldRequests);
router.post('/update-hold-status', businessProposalController.updateHoldStatus);

router.post('/update-proposal-status', businessProposalController.updateProposalStatus);


module.exports = router;