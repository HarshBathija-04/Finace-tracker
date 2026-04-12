import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String, enum: ["income", "expense"], required: true,
    },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    payment: { type: String, enum: ["card", "cash", "upi"] },
    note: { type: String },

    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "monthly", required: function() { return this.isRecurring; }  },
      endDate: { type: Date, default: null },
      status: { type: String, enum: ["active", "paused", "cancelled"], default: "active" },
    },
  }, { timestamps: true }
);

const transactionModel = mongoose.model("Transaction", transactionSchema);

export default transactionModel;