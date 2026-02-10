const express = require('express');
const { createTender, getTenders, updateTender, deleteTender,getTenderById } = require('../controllers/tenderController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, createTender);
router.get('/', protect, getTenders);
router.get('/:id', protect, getTenderById);
router.put("/:id", protect, updateTender);    
router.delete("/:id", protect, deleteTender);
module.exports = router;
