import budgetModel from "../models/Budget.js";

function calculateBudgetInsights(budget) {
  const overallPercentage = (budget.spent / budget.limit) * 100;
  let overallAlert = "Within budget";

  if(overallPercentage >= 100) overallAlert = "Budget exceeded!";
  else if(overallPercentage >= 80) overallAlert = "Warning: 80% budget used";

  const savingsPercent = budget.targetSavings
    ? ((budget.spent / budget.targetSavings) * 100).toFixed(2)
    : 0;

  const categoryAlerts = budget.categoryBudgets.map(cat => {
    const percentage = (cat.spent / cat.categoryLimit) * 100;
    let alert = "Within budget";

    if(percentage >= 100) alert = "Budget exceeded!";
    else if(percentage >= 80) alert = "Warning: 80% budget used";

    return {
      category: cat.category,
      categorySpent: cat.spent,
      categoryLimit: cat.categoryAlerts,
      percentage: Number(percentage.toFixed(2)) + "%",
      alert,
    };
  });

  return {
    overall: {
      spent: budget.spent,
      limit: budget.limit,
      remaining: budget.limit - budget.spent,
      percentage: Math.round(overallPercentage) + "%",
      alert: overallAlert,
    },
    savingsTargetPercent: savingsPercent + "%",
    categoryAlerts,
  };
}

export const setBudget = async (req, res) => {
  try {
    const { userId, month, year, limit, categoryBudgets, targetSavings } = req.body;

    const existingBudget = await budgetModel.findOne({ 
      userId, 
      month: Number(month),
      year: Number(year) 
    });

    if(existingBudget) {
      return res.status(400).json({ message: "Budget already exists for this month" });
    }

    const budget = await budgetModel.create({ 
      userId, 
      month: Number(month), 
      year: Number(year), 
      limit,
      spent: 0,
      targetSavings: targetSavings || 0,
      categoryBudgets: categoryBudgets?.map(cat => ({ ...cat, spent: 0 })) || [], 
    });
    res.status(201).json({ message: "Budget set successfully", budget });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getBudget = async (req, res) => {
  try {
    const { userId, month, year } = req.params;

    const budget = await budgetModel.findOne({ userId, month: Number(month), year: Number(year) });
    if(!budget) {
      return res.status(404).json({ message: "No budget found" });
    }

    const insights = calculateBudgetInsights(budget);

    res.status(200).json({
      ...budget._doc,
      insights
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { limit, categoryBudgets, targetSavings } = req.body;
    const { id } = req.params;

    const updateFields = {};
    if(limit) updateFields.limit = limit;
    if(categoryBudgets) updateFields.categoryBudgets = categoryBudgets;
    if(targetSavings !== undefined) updateFields.targetSavings = targetSavings;

    const budget = await budgetModel.findByIdAndUpdate(id, updateFields, { new: true });
    if(!budget) {
      return res.status(404).json({ message: "No budget found" });
    }

    const insights = calculateBudgetInsights(budget);

    res.status(200).json({ message: "Budget updated successfully", budget, insights });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await budgetModel.findByIdAndDelete(id);
    if(!budget) {
      return res.status(404).json({ message: "No budget found" });
    }

    res.status(200).json({ message: "Budget deleted successfully", budget });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
