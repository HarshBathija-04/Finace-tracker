import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBudget, setBudget, updateBudget, deleteBudget } from "../../redux/slices/budgetSlice";

const categories = [
  "groceries","food","shopping","travel","entertainment",
  "bills","utilities","rent","other",
];

const BudgetSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.profile);
  const { budget, loading: budgetLoading } = useSelector((state) => state.budget);

  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [targetSavings, setTargetSavings] = useState("");
  const [categoryBudgets, setCategoryBudgets] = useState([]);

  useEffect(() => {
    if (user?._id) {
      const now = new Date();
      dispatch(getBudget({ userId: user._id, month: now.getMonth() + 1, year: now.getFullYear() }));
    }
  }, [dispatch, user?._id]);

  useEffect(() => {
    if (budget) {
      setMonthlyLimit(budget.limit);
      setTargetSavings(budget.targetSavings || "");
      setCategoryBudgets(budget.categoryBudgets || []);
    }
  }, [budget]);

  const handleCategoryChange = (cat, value) => {
    setCategoryBudgets((prev) =>
      prev.map((c) => (c.category === cat ? { ...c, categoryLimit: Number(value) } : c))
    );
  };

  const handleAddCategory = (cat) => {
    if (!categoryBudgets.some((c) => c.category === cat)) {
      setCategoryBudgets([...categoryBudgets, { category: cat, categoryLimit: 0 }]);
    }
  };

  const handleSaveBudget = () => {
    const now = new Date();
    const payload = {
      limit: Number(monthlyLimit),
      targetSavings: Number(targetSavings),
      categoryBudgets: categoryBudgets.map(c => ({
        category: c.category,
        categoryLimit: Number(c.categoryLimit),
      })),
    };

    if (budget?._id) {
      dispatch(updateBudget({ id: budget._id, budget: payload }));
    } else {
      dispatch(setBudget({ ...payload, userId: user._id, month: now.getMonth() + 1, year: now.getFullYear() }));
    }
  };

  const handleDeleteBudget = () => {
    if (budget?._id) {
      dispatch(deleteBudget(budget._id));
    }
  };

  if (budgetLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="md:text-lg text-md font-semibold mb-2">Budget Settings</h2>

      <div>
        <label className="md:text-sm text-xs font-medium text-[#6B7280]">Monthly Budget (₹)</label>
        <input
          type="number"
          value={monthlyLimit}
          onChange={(e) => setMonthlyLimit(e.target.value)}
          className="w-full p-2 border-2 border-[#6B7280] rounded-lg mb-2 text-sm md:text-base text-[#6B7280] outline-0 focus:border-[#2563EB]"
        />
      </div>

      <div>
        <label className="md:text-sm text-xs font-medium text-[#6B7280]">Target Savings (₹)</label>
        <input
          type="number"
          value={targetSavings}
          onChange={(e) => setTargetSavings(e.target.value)}
          className="w-full p-2 border-2 border-[#6B7280] rounded-lg mb-2 text-sm md:text-base text-[#6B7280] outline-0 focus:border-[#2563EB]"
        />
      </div>

      <div>
        <h3 className="text-md font-semibold mt-4">Category Budgets</h3>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-[#6B7280] border-collapse">
            <thead className="bg-[#E5E7EB]">
              <tr>
                <th className="px-4 py-2 text-left text-sm md:text-base uppercase text-[#2563EB]">Category</th>
                <th className="px-4 py-2 text-left text-sm md:text-base uppercase text-[#2563EB]">Limit (₹)</th>
              </tr>
            </thead>
            <tbody>
              {categoryBudgets.map((cat, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 capitalize text-sm md:text-base">{cat.category}</td>
                  <td className="px-4 py-2 text-sm md:text-base">
                    <input
                      type="number"
                      value={cat.categoryLimit}
                      onChange={(e) => handleCategoryChange(cat.category, e.target.value)}
                      className="w-full p-1 border-2 border-[#6B7280] rounded text-[#6B7280] outline-0 focus:border-[#2563EB]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <label className="md:text-sm text-xs font-medium text-[#6B7280]">Add Category</label>
          <select
            onChange={(e) => handleAddCategory(e.target.value)}
            className="w-full p-2 border-2 border-[#6B7280] text-sm md:text-base rounded-lg mb-2 text-[#6B7280] outline-0 focus:border-[#2563EB]"
          >
            <option value="">Select category</option>
            {categories.filter((c) => !categoryBudgets.some((cb) => cb.category === c))
                       .map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="flex gap-2 md:mt-4 mt-2">
          <button
            onClick={handleSaveBudget}
            disabled={budgetLoading}
            className="bg-blue-600 text-white text-sm md:text-base px-4 py-2 rounded hover:bg-blue-700"
          >
            {budget ? "Update Budget" : "Set Budget"}
          </button>
          {budget && (
            <button
              onClick={handleDeleteBudget}
              className="bg-red-500 text-white text-sm md:text-base px-4 py-2 rounded hover:bg-red-600"
            >
              Delete Budget
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetSettings;
