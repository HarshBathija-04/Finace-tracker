import transactionModel from "../models/Transaction.js";
import budgetModel from "../models/Budget.js";
import { autoCategorizeTransaction, extractTransactionFromReceipt, budgetInsights } from "../services/gemini.js";
import { createNotification } from "../services/notificationService.js";
import fs from "fs";
import mime from "mime-types";
import { create } from "domain";

const updateCategorySpent = (budget, category, amount) => {
  const cat = budget.categoryBudgets.find(c => c.category === category);
  if(cat) {
    cat.spent = (cat.spent || 0) + amount;
    if(cat.spent < 0) cat.spent = 0;
  }
}

const triggerBudgetCheck = async (userId, month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const transactions = await transactionModel.find({
    userId, date: { $gte: start, $lte: end },
  });

  const budget = await budgetModel.findOne({ userId, month, year });
  if(!budget) return;

  const insights = await budgetInsights(userId, transactions, budget);

  if(insights.warnings && insights.warnings.length > 0) {
    for(let w of insights.warnings) {
      await createNotification(userId, w, "budget", true);
    }
  }
}

export const addTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, category, amount, date, payment, note, recurring } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "Invalid date provided" });
    }

    const transaction = await transactionModel.create({ 
      userId,
      type,
      category,
      amount: Number(amount),
      date: parsedDate,
      payment,
      note, 
      recurring: recurring || { isRecurring: false },
    });

    if(type === "expense") {
      const month = Number(parsedDate.getMonth() + 1);
      const year = Number(parsedDate.getFullYear());
  
      let budget = await budgetModel.findOne({ userId, month, year });
  
      if(!budget) {
        budget = await budgetModel.create({
          userId,
          month,
          year,
          limit: 0,
          spent: 0,
          targetSavings: 0,
          categoryBudgets: [],
        });
      }

      budget.spent += Number(amount);
      updateCategorySpent(budget, category, Number(amount));
      await budget.save();

      await triggerBudgetCheck(userId, month, year);
    }

    res.status(201).json({ message: "New transaction added", transaction });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getTrasactions = async (req, res) => {
  try {
    const transactions = await transactionModel.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { amount, category, date, payment, note, type } = req.body;

    const oldTransaction = await transactionModel.findOne(
      { _id: req.params.id, userId: req.user.id },
    );
    if(!oldTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const oldMonth = oldTransaction.date.getMonth() + 1;
    const oldYear = oldTransaction.date.getFullYear();

    if(oldTransaction.type === "expense") {
      const oldBudget = await budgetModel.findOne({ userId: req.user.id, month: oldMonth, year: oldYear });
      if(oldBudget) {
        oldBudget.spent -= oldTransaction.amount;
        if(oldBudget.spent < 0) oldBudget.spent = 0;
        updateCategorySpent(oldBudget, oldTransaction.category, -oldTransaction.amount);
        await oldBudget.save();
      }
    }

    oldTransaction.amount = amount ?? oldTransaction.amount;
    oldTransaction.category = category ?? oldTransaction.category;
    oldTransaction.date = date ? new Date(date) : oldTransaction.date;
    oldTransaction.payment = payment ?? oldTransaction.payment;
    oldTransaction.note = note ?? oldTransaction.note;
    oldTransaction.type = type ?? oldTransaction.type;
    const updatedTransaction = await oldTransaction.save();

    const newMonth = updatedTransaction.date.getMonth() + 1;
    const newYear = updatedTransaction.date.getFullYear();

    if(updatedTransaction.type === "expense") {
      let newBudget = await budgetModel.findOne({ userId: req.user.id, month: newMonth, year: newYear });
      if(!newBudget) {
        newBudget = await budgetModel.create({ userId: req.user.id, month: newMonth, year: newYear, spent: 0, limit: 0, categoryBudgets: [], });
      }
  
      newBudget.spent += updatedTransaction.amount;
      updateCategorySpent(newBudget, updatedTransaction.category, updatedTransaction.amount);
      await newBudget.save();

      await triggerBudgetCheck(req.user.id, newMonth, newYear);
    }

    res.json({ message: "Transaction updated", transaction: updatedTransaction });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne(
      { _id: req.params.id, userId: req.user.id, }
    );
    if(!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await transactionModel.deleteOne({ _id: req.params.id, userId: req.user.id });

    if(transaction.type === "expense") {
      const month = Number(transaction.date.getMonth() + 1);
      const year = Number(transaction.date.getFullYear());
  
      const budget = await budgetModel.findOne({ 
        userId: req.user.id,
        month,
        year
      });
  
      if(budget) {
        budget.spent -= transaction.amount;
        if(budget.spent < 0) budget.spent = 0;
        updateCategorySpent(budget, transaction.category, -transaction.amount);
        await budget.save();

        await triggerBudgetCheck(req.user.id, month, year);
      }
    }
    
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const pauseRecurringTxn = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
      "recurring.isRecurring": true,
    });

    if(!transaction) {
      return res.status(404).json({ message: "Recurring transaction not found" });
    }

    transaction.recurring.status === "paused";
    await transaction.save();

    res.json({ message: "Recurring transaction paused", transaction });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const resumeRecurringTxn = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
      "recurring.isRecurring": true,
    });

    if(!transaction) {
      return res.status(404).json({ message: "Recurring transaction not found" });
    }

    transaction.recurring.status = "active";
    await transaction.save();

    res.json({ message: "Recurring transaction resumed", transaction });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const cancelRecurringTxn = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
      "recurring.isRecurring": true,
    });

    if(!transaction) {
      return res.status(404).json({ message: "Recurring transaction not found" });
    }

    transaction.recurring.status = "cancelled";
    transaction.recurring.isRecurring = false;
    await transaction.save();

    res.json({ message: "Recurring transaction cancelled", transaction });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const uploadReceipt = async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).json({ message: "No receipt uploaded" });
    }

    const receiptPath = req.file.path;

    let mimeType = mime.lookup(receiptPath);
    if(!mimeType) {
      return res.status(400).json({ message: "Unsupported or unknown file type" });
    }

    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if(!supportedTypes) {
      return res.status(400).json({
        message: `Unsupported file type: ${mimeType}. Allowed: ${supportedTypes.join(", ")}`
      });
    }

    const receiptBuffer = fs.readFileSync(receiptPath);
    const receiptBase64 = receiptBuffer.toString("base64");

    const extracted = await extractTransactionFromReceipt(receiptBase64, mimeType);

    if(!extracted) {
      return res.status(400).json({ message: "Failed to extract data from receipt" });
    }

    const userId = req.user.id;
    const { type, category, amount, date, payment, note } = extracted;

    if(!["income", "expense"].includes(type)) {
      type = "expense";
    }

    if(!category || category === "other") {
      if(note && note.trim() !== "") {
        try {
          category = await autoCategorizeTransaction(note);
        } catch (error) {
          console.log("Auto-Categorization failed: ", error);
          category = "other";
        }
      } else {
        category = "other";
      }
    }

    // const parsedDate = date ? new Date(date) : new Date();
    // if(isNaN(parsedDate)) {
    //   return res.status(400).json({ message: "Invalid date extracted from the receipt" });
    // }

    // const newTransaction = await transactionModel.create({
    //   userId,
    //   type,
    //   category,
    //   amount: Number(amount),
    //   date: parsedDate,
    //   payment,
    //   note
    // });

    // if(type === "expense") {
    //   const month = Number(parsedDate.getMonth() + 1);
    //   const year = Number(parsedDate.getFullYear());
  
    //   let budget = await budgetModel.findOne({ userId, month, year });
  
    //   if(!budget) {
    //     budget = await budgetModel.create({
    //       userId,
    //       month,
    //       year,
    //       limit: 0,
    //       spent: 0,
    //     });
    //   }
  
    //   budget.spent += Number(amount);
    //   updateCategorySpent(budget, category, Number(amount));
    //   await budget.save();
    // }

    res.status(200).json({ 
      message: "Processed receipt successfully", 
      extracted: { type, category, amount, date, payment, note }
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error processing receipt" });
  }
};