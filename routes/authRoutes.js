const express = require('express');
const { register, login, approveUser, getPendingUsers, getAllUsers ,forgotPassword} = require('../controllers/authController');
const router = express.Router();
const sendEmail = require('../utils/mailer');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', register);
router.get("/pending-users", protect, adminOnly, getPendingUsers);
router.get("/users", protect, adminOnly, getAllUsers);
router.put("/approve-user/:id", protect, adminOnly, approveUser);

router.post('/login', login);
router.post("/reset-password",forgotPassword);




module.exports = router;

