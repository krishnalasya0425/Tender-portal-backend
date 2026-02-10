const Tender = require('../models/Tender');
const User = require('../models/User');
const checkAndSendDeadlineReminder = require("../utils/checkAndSendDeadlineReminder");


/* ================= CREATE ================= */
exports.createTender = async (req, res) => {
  try {
    const tender = await Tender.create({
      ...req.body,
      createdBy: req.user.id
    });
    await checkAndSendDeadlineReminder(tender);
    res.status(201).json(tender);
  } catch (err) {
    console.error("Tender creation error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ================= READ ================= */
exports.getTenders = async (req, res) => {
  try {
    let query = {};

    // For regular users, filter by allowed verticals
    if (req.user.role === "user") {
      const user = await User.findById(req.user.id);
      
      // If user has "ALL" permission, don't filter by vertical
      if (!user.allowedVerticals.includes("ALL")) {
        query.Vertical = { $in: user.allowedVerticals };
      }
    }

    const tenders = await Tender.find(query).sort({ createdAt: -1 });
    res.json(tenders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE ================= */
exports.updateTender = async (req, res) => {
  try {
    let query;
    
    // Admin can update any tender, regular users can only update their own
    if (req.user.role === "admin") {
      query = { _id: req.params.id };
    } else {
      query = { _id: req.params.id, createdBy: req.user.id };
    }

    const tender = await Tender.findOneAndUpdate(
      query,
      {
        ...req.body,
        DeadlineReminderSent: false // reset if deadline changes
      },
      { new: true, runValidators: true }
    );

    if (!tender) {
      return res.status(404).json({ message: "Tender not found" });
    }

    // 🔥 Immediate reminder check
    await checkAndSendDeadlineReminder(tender);

    res.json(tender);
  } catch (err) {
    console.error("Tender update error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE ================= */
exports.deleteTender = async (req, res) => {
  try {
    let query;
    
    // Admin can delete any tender, regular users can only delete their own
    if (req.user.role === "admin") {
      query = { _id: req.params.id };
    } else {
      query = { _id: req.params.id, createdBy: req.user.id };
    }

    const tender = await Tender.findOneAndDelete(query);

    if (!tender) {
      return res.status(404).json({ message: "Tender not found" });
    }

    res.json({ message: "Tender deleted successfully" });
  } catch (err) {
    console.error("Tender delete error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET SINGLE TENDER ================= */
exports.getTenderById = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // For non-admin users, also check vertical permissions
    if (req.user.role === "user") {
      const user = await User.findById(req.user.id);
      query.Vertical = { $in: user.allowedVerticals };
    }

    const tender = await Tender.findOne(query);
    
    if (!tender) {
      return res.status(404).json({ message: "Tender not found or not authorized" });
    }

    res.json(tender);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};