const Chat = require('../models/chats.model');
const BusinessProposal = require('../models/businessProposal.model');
const Investor = require('../models/investorSide.model');

exports.chatController = {
  // Create a new chat
  createChat: async (req, res) => {
    try {
      const { proposal, investor, message, senderId, senderModel } = req.body;

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

      // Validate investor ID
      if (!investor) {
        return res.status(400).json({
          status: false,
          message: "Investor ID is required"
        });
      }

      // Check if investor exists
      const investorExists = await Investor.findById(investor);
      if (!investorExists) {
        return res.status(400).json({
          status: false,
          message: "Invalid investor ID - investor not found"
        });
      }

      // Validate sender details
      if (!senderId || !senderModel || !['BusinessProposal', 'Investor'].includes(senderModel)) {
        return res.status(400).json({
          status: false,
          message: "Valid sender ID and sender model (BusinessProposal or Investor) are required"
        });
      }

      // Create message object
      const messageObj = {
        sender: senderId,
        senderModel,
        message
      };

      // Check if chat already exists
      let chat = await Chat.findOne({ proposal, investor });

      if (chat) {
        // If chat exists, push new message to all_chats array
        chat.all_chats.push(messageObj);
        await chat.save();
      } else {
        // Create new chat if it doesn't exist
        chat = await Chat.create({
          proposal,
          investor,
          all_chats: [messageObj]
        });
      }

      res.status(201).json({
        status: true,
        message: "Chat message added successfully",
        data: chat
      });
    } catch (error) {
      console.error("Create Chat Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Get all chats
  getAllChats: async (req, res) => {
    try {
      const chats = await Chat.find()
        .populate('proposal', 'businessLegalName personalName')
        .populate('investor', 'fullName email')
        .populate('all_chats.sender')
        .sort('-updatedAt');

      res.status(200).json({
        status: true,
        data: chats
      });
    } catch (error) {
      console.error("Get All Chats Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Get chats by proposal ID
  getChatsByProposal: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required"
        });
      }

      const chats = await Chat.find({ proposal: proposalId })
        .populate('proposal', 'businessLegalName personalName')
        .populate('investor', 'fullName email')
        .populate('all_chats.sender')
        .sort('-updatedAt');

      res.status(200).json({
        status: true,
        data: chats
      });
    } catch (error) {
      console.error("Get Chats By Proposal Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Get chats by investor ID
  getChatsByInvestor: async (req, res) => {
    try {
      const { investorId } = req.params;

      if (!investorId) {
        return res.status(400).json({
          status: false,
          message: "Investor ID is required"
        });
      }

      const chats = await Chat.find({ investor: investorId })
        .populate('proposal', 'businessLegalName personalName')
        .populate('investor', 'fullName email')
        .populate('all_chats.sender')
        .sort('-updatedAt');

      res.status(200).json({
        status: true,
        data: chats
      });
    } catch (error) {
      console.error("Get Chats By Investor Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Get chat by proposal and investor
  getChatByProposalAndInvestor: async (req, res) => {
    try {
      const { proposalId, investorId } = req.params;

      if (!proposalId || !investorId) {
        return res.status(400).json({
          status: false,
          message: "Both Proposal ID and Investor ID are required"
        });
      }

      const chat = await Chat.findOne({
        proposal: proposalId,
        investor: investorId
      })
        .populate('proposal', 'businessLegalName personalName')
        .populate('investor', 'fullName email')
        .populate('all_chats.sender');

      if (!chat) {
        return res.status(200).json({
          status: true,
          data: null,
          message: "No chat found for this combination"
        });
      }

      res.status(200).json({
        status: true,
        data: chat
      });
    } catch (error) {
      console.error("Get Chat By Proposal and Investor Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Add message to existing chat
  addMessage: async (req, res) => {
    try {
      const { proposalId, investorId } = req.params;
      const { message, senderId, senderModel } = req.body;

      if (!proposalId || !investorId) {
        return res.status(400).json({
          status: false,
          message: "Both Proposal ID and Investor ID are required"
        });
      }

      if (!message || !senderId || !senderModel) {
        return res.status(400).json({
          status: false,
          message: "Message, sender ID, and sender model are required"
        });
      }

      if (!['BusinessProposal', 'Investor'].includes(senderModel)) {
        return res.status(400).json({
          status: false,
          message: "Invalid sender model - must be either BusinessProposal or Investor"
        });
      }

      const messageObj = {
        sender: senderId,
        senderModel,
        message
      };

      const chat = await Chat.findOneAndUpdate(
        {
          proposal: proposalId,
          investor: investorId
        },
        {
          $push: { all_chats: messageObj }
        },
        {
          new: true,
          runValidators: true
        }
      )
        .populate('proposal', 'businessLegalName personalName')
        .populate('investor', 'fullName email')
        .populate('all_chats.sender');

      if (!chat) {
        return res.status(404).json({
          status: false,
          message: "Chat not found"
        });
      }

      res.status(200).json({
        status: true,
        message: "Message added successfully",
        data: chat
      });
    } catch (error) {
      console.error("Add Message Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  },

  // Delete chat
  deleteChat: async (req, res) => {
    try {
      const { chatId } = req.params;

      if (!chatId) {
        return res.status(400).json({
          status: false,
          message: "Chat ID is required"
        });
      }

      const chat = await Chat.findByIdAndDelete(chatId);

      if (!chat) {
        return res.status(404).json({
          status: false,
          message: "Chat not found"
        });
      }

      res.status(200).json({
        status: true,
        message: "Chat deleted successfully"
      });
    } catch (error) {
      console.error("Delete Chat Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error"
      });
    }
  }
};