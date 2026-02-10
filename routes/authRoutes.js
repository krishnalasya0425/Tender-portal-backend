const express = require('express');
const { register, login, approveUser, getPendingUsers } = require('../controllers/authController');
const router = express.Router();
const sendEmail = require('../utils/mailer'); // Import the mailer
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', register);
router.get("/pending-users", protect, adminOnly, getPendingUsers);
router.put("/approve-user/:id", protect, adminOnly, approveUser);

router.post('/login', login);

module.exports = router;

