const Transaction = require('../models/transactions.model');
const BusinessProposal = require('../models/businessProposal.model');
const Investor = require('../models/investorSide.model');
exports.transactionController = {
  // Create a new transaction
  createTransaction: async (req, res) => {
    try {
      const { proposal, investor, contact_business_info, terms_of_investor, accept_or_reject,business_name,
        business_version  } = req.body;

      // Validate proposal ID
      if (!proposal) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required"
        });
      }

      // Check if proposal exists
      const proposalExists = await BusinessProposal.findById(proposal);
      if (!proposalExists) {
        return res.status(400).json({
          status: false,
          message: "Invalid proposal ID - proposal not found"
        });
      }
      if (investor) {
        const investorExists = await Investor.findById(investor);
        if (!investorExists) {
          return res.status(400).json({
            status: false,
            message: "Invalid investor ID - investor not found"
          });
        }
      }
      if (accept_or_reject && !['accept', 'reject'].includes(accept_or_reject)) {
        return res.status(400).json({
          status: false,
          message: "accept_or_reject must be either 'accept' or 'reject'"
        });
      }
      // Create transaction
      const transaction = await Transaction.create({
        proposal,
        investor,
        contact_business_info: contact_business_info || "",
        terms_of_investor: Boolean(terms_of_investor),
        accept_or_reject,
        business_name: business_name || "",
        business_version: business_version || ""
      });

      res.status(201).json({
        status: true,
        message: "Transaction created successfully",
        data: transaction
      });
    } catch (error) {
      console.error("Create Transaction Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Get all transactions
  getAllTransactions: async (req, res) => {
    try {
      const transactions = await Transaction.find()
        .populate('proposal', 'businessLegalName personalName') // Populate basic proposal info
        .populate('investor', 'fullName email') 
        .sort('-createdAt');

      res.status(200).json({
        status: true,
        data: transactions
      });
    } catch (error) {
      console.error("Get All Transactions Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Get transactions by proposal ID
  getTransactionsByInvestor: async (req, res) => {
    try {
      const { investorId } = req.params;

      if (!investorId) {
        return res.status(400).json({
          status: false,
          message: "Investor ID is required"
        });
      }

      const transactions = await Transaction.find({ 
        investor: investorId,
        status: 'active' // Only get active transactions
      })
        .populate('proposal', 'businessLegalName shortBusinessDesc personalName')
        .populate('investor', 'fullName email')
        .sort('-createdAt');

      res.status(200).json({
        status: true,
        data: transactions
      });
    } catch (error) {
      console.error("Get Transactions By Investor Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  getTransactionsByProposal: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required"
        });
      }

      const transactions = await Transaction.find({ 
        proposal: proposalId,
        status: 'active' // Only get active transactions
      })
        .populate('proposal', 'businessLegalName personalName')
        .populate('investor', 'fullName email')
        .sort('-createdAt');

      res.status(200).json({
        status: true,
        data: transactions
      });
    } catch (error) {
      console.error("Get Transactions By Proposal Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },
  // Get single transaction by ID
  getTransactionById: async (req, res) => {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        return res.status(400).json({
          status: false,
          message: "Transaction ID is required"
        });
      }

      const transaction = await Transaction.findById(transactionId)
        .populate('proposal', 'businessLegalName personalName')
        .populate('investor', 'fullName email');
      if (!transaction) {
        return res.status(404).json({
          status: false,
          message: "Transaction not found"
        });
      }

      res.status(200).json({
        status: true,
        data: transaction
      });
    } catch (error) {
      console.error("Get Transaction By ID Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Update transaction
  updateTransaction: async (req, res) => {
    try {
      const { transactionId, contact_business_info, terms_of_investor, accept_or_reject,
        business_name,
        business_version,
        investor  } = req.body;

      if (!transactionId) {
        return res.status(400).json({
          status: false,
          message: "Transaction ID is required"
        });
      }
      if (investor) {
        const investorExists = await Investor.findById(investor);
        if (!investorExists) {
          return res.status(400).json({
            status: false,
            message: "Invalid investor ID - investor not found"
          });
        }
      }
      if (accept_or_reject && !['accept', 'reject'].includes(accept_or_reject)) {
        return res.status(400).json({
          status: false,
          message: "accept_or_reject must be either 'accept' or 'reject'"
        });
      }
      const updateData = {
        ...(investor !== undefined && { investor }),
        ...(contact_business_info !== undefined && { contact_business_info }),
        ...(terms_of_investor !== undefined && { terms_of_investor: Boolean(terms_of_investor) }),
        ...(accept_or_reject !== undefined && { accept_or_reject }),
        ...(business_name !== undefined && { business_name }),
        ...(business_version !== undefined && { business_version })
      };

      const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!transaction) {
        return res.status(404).json({
          status: false,
          message: "Transaction not found"
        });
      }

      res.status(200).json({
        status: true,
        message: "Transaction updated successfully",
        data: transaction
      });
    } catch (error) {
      console.error("Update Transaction Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Delete transaction
  deleteTransaction: async (req, res) => {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({
          status: false,
          message: "Transaction ID is required"
        });
      }

      const transaction = await Transaction.findByIdAndDelete(transactionId);

      if (!transaction) {
        return res.status(404).json({
          status: false,
          message: "Transaction not found"
        });
      }

      res.status(200).json({
        status: true,
        message: "Transaction deleted successfully"
      });
    } catch (error) {
      console.error("Delete Transaction Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },
  getTransactionByProposalAndInvestor: async (req, res) => {
    try {
      const { proposalId, investorId } = req.params;

      if (!proposalId || !investorId) {
        return res.status(400).json({
          status: false,
          message: "Both Proposal ID and Investor ID are required"
        });
      }

      const transaction = await Transaction.findOne({
        proposal: proposalId,
        investor: investorId
      })
        .select('contact_business_info terms_of_investor')
        .sort('-createdAt');

      if (!transaction) {
        return res.status(200).json({
          status: true,
          data: null,
          message: "No transaction found for this combination"
        });
      }

      res.status(200).json({
        status: true,
        data: transaction
      });
    } catch (error) {
      console.error("Get Transaction By Proposal and Investor Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },
  updateTransactionByProposalAndInvestor: async (req, res) => {
    try {
      const { proposalId, investorId } = req.params;
      const { contact_business_info, terms_of_investor, accept_or_reject,
        business_name,
        business_version  } = req.body;

      if (!proposalId || !investorId) {
        return res.status(400).json({
          status: false,
          message: "Both Proposal ID and Investor ID are required"
        });
      }

      // Validate accept_or_reject if provided
      if (accept_or_reject && !['accept', 'reject'].includes(accept_or_reject)) {
        return res.status(400).json({
          status: false,
          message: "accept_or_reject must be either 'accept' or 'reject'"
        });
      }

      // Check if proposal exists
      const proposalExists = await BusinessProposal.findById(proposalId);
      if (!proposalExists) {
        return res.status(400).json({
          status: false,
          message: "Invalid proposal ID - proposal not found"
        });
      }

      // Check if investor exists
      const investorExists = await Investor.findById(investorId);
      if (!investorExists) {
        return res.status(400).json({
          status: false,
          message: "Invalid investor ID - investor not found"
        });
      }

      const updateData = {
        ...(contact_business_info !== undefined && { contact_business_info }),
        ...(terms_of_investor !== undefined && { terms_of_investor: Boolean(terms_of_investor) }),
        ...(accept_or_reject !== undefined && { accept_or_reject }),
        ...(business_name !== undefined && { business_name }),
        ...(business_version !== undefined && { business_version })
      };

      const transaction = await Transaction.findOneAndUpdate(
        { 
          proposal: proposalId,
          investor: investorId 
        },
        updateData,
        { 
          new: true,
          runValidators: true 
        }
      ).populate('proposal', 'businessLegalName personalName')
        .populate('investor', 'fullName email');

      if (!transaction) {
        return res.status(404).json({
          status: false,
          message: "No transaction found for this proposal and investor combination"
        });
      }

      res.status(200).json({
        status: true,
        message: "Transaction updated successfully",
        data: transaction
      });
    } catch (error) {
      console.error("Update Transaction By Proposal and Investor Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  }
};