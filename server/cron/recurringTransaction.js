import cron from "node-cron";
import transactionModel from "../models/Transaction.js";
import budgetModel from "../models/Budget.js";

const updateCategorySpent = (budget, category, amount) => {
  const cat = budget.categoryBudgets.find(c => c.category === category);
  if(cat) {
    cat.spent = (cat.spent || 0) + amount;
    if(cat.spent < 0) cat.spent = 0;
  }
};

cron.schedule("0 0 * * *", async () => {
  console.log("Processing recurring transaction...");

  const today = new Date();
  const transactions = await transactionModel.find({
    "recurring.isRecurring": true,
    "recurring.status": "active",
    $or: [
      { "recurring.endDate": null },
      { "recurring.endDate": { $gte: today } },
    ]
  });

  for(const t of transactions) {
    let shouldAdd = false;

    const lastDate = t.date;
    if(t.recurring.frequency === "daily") {
      shouldAdd = lastDate.toDateString() !== today.toDateString();
    } else if(t.recurring.frequency === "weekly") {
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      shouldAdd = diffDays >= 7;
    } else if(t.recurring.frequency === "monthly") {
      shouldAdd = today.getMonth() !== lastDate.getMonth() || 
                  today.getFullYear() !== lastDate.getFullYear();
    }

    if(shouldAdd) {
      const newTxn = await transactionModel.create({
        userId: t.userId,
        type: t.type,
        category: t.category,
        amount: t.amount,
        date: today,
        payment: t.payment,
        note: t.note,
        recurring: t.recurring,
      });

      if(t.type === "expense") {
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        let budget = await budgetModel.findOne({ userId: t.userId, month, year });
        if(!budget) {
          budget = await budgetModel.create({ userId: t.userId, month, year, limit: 0, spent: 0, categoryBudgets: [] });
        }
        budget.spent += t.amount;
        updateCategorySpent(budget, t.category, t.amount);
        await budget.save();
      }
    }
  }
});