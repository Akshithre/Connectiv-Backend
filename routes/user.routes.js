const express = require('express');
const router = express.Router();
const { userController } = require('../controllers/user.controller');  // Fix path

router.post('/create', userController.createUser);
router.post('/get-all', userController.getAllUsers);
router.post('/get-user', userController.getUserById);
router.post('/get-user-by-username', userController.getUserByUsername);
router.post('/update', userController.updateUser);
router.post('/delete', userController.deleteUser);
router.post('/register', userController.register);
router.post('/login', userController.login);

module.exports = router;