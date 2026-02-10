const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
    isApproved: {
    type: Boolean,
    default: false,
  },

   role: { type: String, enum: ['user', 'admin'], default: 'user' },
     allowedVerticals: {
    type: [String],
    default: [], 
  }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
