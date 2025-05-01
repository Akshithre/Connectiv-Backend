require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const BusinessProposal = require('./models/businessProposal.model'); 
const userRoutes = require('./routes/user.routes');
const businessProposalRoutes = require('./routes/businessProposal.routes');
const investorRoutes = require('./routes/investorSide.routes');
const transactionRoutes = require('./routes/transactions.routes');
const chatRoutes = require('./routes/chats.routes');
const notificationRoutes = require('./routes/notifications.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://hubridgeui.vercel.app',
      'https://smeinvestorhub.com',
      'https://devui.smeinvestorhub.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  credentials: true,
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Enable pre-flight requests
app.options('*', cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Basic health check endpoints
app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.get("/test", (req, res) => {
  res.json({ 
    message: "Server is running!",
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/business-proposal', businessProposalRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chats',chatRoutes);
app.use('/api/notifications',notificationRoutes);
// Razorpay payment routes
app.post("/create-order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const amount = Math.round(req.body.amount); // Ensure amount is a whole number
    const proposalId = req.body.proposalId; // Get proposalId from request
    
    const options = {
      amount: amount,
      currency: "INR",
      receipt: 'receipt_' + Date.now(),
      payment_capture: 1,
      notes: {
        merchant_order_id: Date.now().toString(),
        proposalId: proposalId // Include proposalId in notes
      }
    };

    console.log("Creating order with options:", options);

    const order = await razorpay.orders.create(options);
    
    console.log("Order created:", order);

    res.json({
      status: true,
      message: "Order created successfully",
      data: {
        id: order.id,
        currency: order.currency,
        amount: order.amount
      }
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ 
      status: false,
      message: "Failed to create order",
      error: err.message 
    });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      notes // Add this to get the notes object
    } = req.body;

    console.log('Payment verification request:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      notes
    });

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(text)
      .digest("hex");
    
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ 
        status: false,
        message: "Payment verification failed" 
      });
    }

    // Get proposalId from notes
    const proposalId = notes?.proposalId;
    console.log('ProposalId from notes:', proposalId);

    if (proposalId) {
      try {
        const updatedProposal = await BusinessProposal.findByIdAndUpdate(
          proposalId,
          {
            $set: {
              paymentStatus: {
                isComplete: true,
                paymentDetails: {
                  orderId: razorpay_order_id,
                  paymentId: razorpay_payment_id,
                  amount: req.body.amount,
                  timestamp: new Date()
                }
              }
            }
          },
          { new: true }
        );

        console.log('Updated proposal:', updatedProposal);

        if (!updatedProposal) {
          console.log('Proposal not found for ID:', proposalId);
        }
      } catch (updateError) {
        console.error('Error updating proposal:', updateError);
      }
    }

    res.json({
      status: true,
      message: "Payment verified successfully",
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ 
      status: false,
      message: "Payment verification failed",
      error: err.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.get("/test-email-setup", async (req, res) => {
  try {
    const emailService = require('./services/email.service');
    const domains = await emailService.mailchimpClient.senders.list();
    res.json({
      domains,
      message: 'Check your server console for complete domain information'
    });
  } catch (error) {
    console.error('Error checking email setup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this to your server.js
app.post("/test-welcome-email", async (req, res) => {
  try {
    const emailService = require('./services/email.service');
    const response = await emailService.sendWelcomeEmail({
      fullName: "Test User",
      email: "poojithmeduri@gmail.com", // Your email
      username: "testuser",
      userType: "investor"
    });
    
    res.json({
      status: 'success',
      response
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      details: error.response?.body
    });
  }
});

app.get("/check-sending-settings", async (req, res) => {
  const mailchimp = require('@mailchimp/mailchimp_transactional')(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY);
  
  try {
    const domains = await mailchimp.senders.domains();
    const senders = await mailchimp.senders.list();
    
    res.json({
      domains,
      senders
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/test-email", async (req, res) => {
  try {
    const emailService = require('./services/email.service');
    
    // First verify domain setup
    const domains = await emailService.mailchimpClient.senders.domains();
    console.log('Current domain configuration:', domains);
    
    // Send test email
    const testResult = await emailService.sendWelcomeEmail({
      fullName: "Test User",
      email: "poojithmeduri@gmail.com",
      username: "testuser",
      userType: "investor"
    });
    
    res.json({
      domainConfig: domains.find(d => d.domain === 'smeinvestorhub.com'),
      emailResult: testResult
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post("/test-sender", async (req, res) => {
  try {
    const mailchimp = require('@mailchimp/mailchimp_transactional')(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY);
    
    // Test with default Mandrill sender first
    const testMessage = {
      from_email: "noreply@smeinvestorhub.com",
      subject: "Test Email",
      text: "Testing email configuration",
      to: [{ 
        email: "poojithmeduri@gmail.com",
        type: "to"
      }]
    };

    const response = await mailchimp.messages.send({ message: testMessage });
    
    res.json({
      status: 'success',
      response
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get("/verify-domain-setup", async (req, res) => {
  try {
    const mailchimp = require('@mailchimp/mailchimp_transactional')(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY);
    const domains = await mailchimp.senders.domains();
    const domainInfo = domains.find(d => d.domain === 'smeinvestorhub.com');
    
    res.json({
      domainInfo,
      requiredRecords: {
        spf: domainInfo?.spf,
        dkim: domainInfo?.dkim,
        dmarc: domainInfo?.dmarc
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/check-sending-capabilities", async (req, res) => {
  try {
    const mailchimp = require('@mailchimp/mailchimp_transactional')(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY);
    
    const [userInfo, domains, templates] = await Promise.all([
      mailchimp.users.info(),
      mailchimp.senders.domains(),
      mailchimp.templates.list()
    ]);

    const testDomain = domains.find(d => d.domain === 'smeinvestorhub.com');
    
    res.json({
      account: {
        username: userInfo.username,
        hourly_quota: userInfo.hourly_quota,
        backlog: userInfo.backlog
      },
      domain: {
        name: testDomain.domain,
        verified: !!testDomain.verified_at,
        spf: testDomain.spf?.valid,
        dkim: testDomain.dkim?.valid,
        dmarc: testDomain.dmarc?.valid
      },
      templates: templates.length,
      sending_access: {
        public_key: userInfo.public_key,
        website: userInfo.website
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/test-mandrill-send", async (req, res) => {
  try {
    const mailchimp = require('@mailchimp/mailchimp_transactional')(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY);
    
    // First check domain verification
    const domains = await mailchimp.senders.domains();
    const domainInfo = domains.find(d => d.domain === 'smeinvestorhub.com');
    
    // Try sending a simple test email
    const message = {
      subject: "Test Email",
      from_email: "noreply@smeinvestorhub.com",
      from_name: "SME-Investor Hub Test",
      text: "This is a test email from SME-Investor Hub",
      to: [{ 
        email: "poojithmeduri@gmail.com",
        type: "to"
      }]
    };

    const response = await mailchimp.messages.send({ message });
    
    res.json({
      domainInfo,
      sendResponse: response
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server only after successful DB connection
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app; // Export for testing purposes