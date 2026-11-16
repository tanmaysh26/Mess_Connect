const mongoose = require("mongoose");

// One record per complaint status change (UC-006). Entries are never edited or deleted,
// so together they form the complaint's audit trail (NFR-011).
const statusHistorySchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true, index: true },
  oldStatus: { type: String, enum: ["Pending", "In Progress", "Resolved"], required: true },
  newStatus: { type: String, enum: ["Pending", "In Progress", "Resolved"], required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  adminName: { type: String, required: true },
  changedAt: { type: Date, required: true }
});

module.exports = mongoose.model("StatusHistory", statusHistorySchema);
