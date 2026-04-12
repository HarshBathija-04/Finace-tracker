import mongoose from "mongoose";

const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      "groceries", "food", "shopping", "travel", "entertainment", "bills", "utilities", "rent", "other"
    ]
  },
  spent: { type: Number, default: 0 },
  categoryLimit: { type: Number, default: 0 },
});

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    limit: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    targetSavings: { type: Number, default: 0 },
    categoryBudgets: [categoryBudgetSchema],
  }, { timestamps: true }
);

const budgetModel = mongoose.model("Budget", budgetSchema);

export default budgetModel;