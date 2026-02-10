const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
  SNo: String,
  TenderNumber: String,
  Description: String,
  Vertical: {
      type: String,
      enum: [
        "AR/VR",
        "AI",
        "AI/UGV",
        "UGV",
        "OTHERS",
        "DRONE/AI",
        "UAV",
        "RCWS/AWS",
      ],
      required: true,
    },
  Deadline: Date,
  Status: String,
  BidPrice: String,
  CurrentStatusDescription: String,
 Gem: {
  type: String,
  enum: [
    "Catalogue Uploaded",
    "Costing",
    "Submitted",
  ],
  default: null,


},

  OrganisationName: String,
  EMD: String,
  Prebid: String,
  L1BidDetails: String,
  L2BidDetails: String,
  L3BidDetails: String,
  MajorSpec: String,
  Link: String,
  Remarks: String,
  DeadlineReminderSent: {
  type: Boolean,
  default: false
},

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Tender', tenderSchema);
