const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  category: {
    type: String,
    enum: ["Food Quality", "Cleanliness", "Staff Behaviour", "Other"],
    required: true
  },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["Pending", "In Progress", "Resolved"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);