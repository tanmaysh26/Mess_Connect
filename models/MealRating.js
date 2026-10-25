const mongoose = require("mongoose");

const mealRatingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  mealType: { type: String, enum: ["Breakfast", "Lunch", "Dinner"], required: true },
  mealDate: { type: Date, required: true },
  rating: { type: Number, min: 1, max: 5, required: true }
}, { timestamps: true });

module.exports = mongoose.model("MealRating", mealRatingSchema);