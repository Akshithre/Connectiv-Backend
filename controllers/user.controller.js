const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; 

exports.userController = {
  register: async (req, res) => {
    try {
      const { fullName, username, email, phoneNumber, userType, password } = req.body;
      
      if (!fullName || !username || !email || !phoneNumber || !userType || !password) {
        return res.status(400).json({ 
          status: false, 
          message: 'All fields are required' 
        });
      }

      const userExists = await User.findOne({ username });
      if (userExists) {
        return res.status(400).json({ 
          status: false, 
          message: 'username already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        fullName,
        username,
        email,
        phoneNumber,
        userType,
        password: hashedPassword
      });

      // Send welcome email
      try {
        console.log('Hi There. Initiating welcome email for:', email);
        await emailService.sendWelcomeEmail(user);
        console.log('Welcome email sent successfully to:', email);
      } catch (emailError) {
        console.error('Error sending welcome email:', {
          error: emailError,
          userEmail: email,
          errorDetails: emailError.response?.body
        });
        // Continue with registration even if email fails
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        status: true,
        message: 'User registered successfully',
        token,
        data: {
          userId: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          userType: user.userType
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          status: false,
          message: 'username and password are required'
        });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({
          status: false,
          message: 'Invalid credentials'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        status: true,
        message: 'Login successful',
        token,
        data: {
          userId: user._id,
          fullName: user.fullName,
          username: user.username,
          userType: user.userType
        }
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },
  createUser: async (req, res) => {
    try {
      const { fullName, username,email, phoneNumber, userType } = req.body;
      
      if (!fullName || !username || !email|| !phoneNumber || !userType) {
        return res.status(400).json({ 
          status: false, 
          message: 'All fields are required' 
        });
      }

      const userExists = await User.findOne({ username });
      if (userExists) {
        return res.status(400).json({ 
          status: false, 
          message: 'username already exists' 
        });
      }

      const user = await User.create({
        fullName,
        username,
        email,
        phoneNumber,
        userType
      });

      res.status(201).json({
        status: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json({
        status: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          status: false,
          message: 'User ID is required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  getUserByUsername: async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({
          status: false,
          message: 'username is required'
        });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({
          status: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { userId, fullName, username,email, phoneNumber, userType } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          status: false,
          message: 'User ID is required'
        });
      }

      const updateFields = {};
      if (fullName) updateFields.fullName = fullName;
      if (username) {
        // Check if new username is already taken by another user
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
          return res.status(400).json({
            status: false,
            message: 'Username already exists'
          });
        }
        updateFields.username = username;
      }
      if (email) updateFields.email = email;
      if (phoneNumber) updateFields.phoneNumber = phoneNumber;
      if (userType) updateFields.userType = userType;

      const user = await User.findByIdAndUpdate(
        userId,
        updateFields,
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          status: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          status: false,
          message: 'User ID is required'
        });
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }
};