import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardSummary } from "../../redux/slices/dashboardSlice";
import { ChartNoAxesCombined, HandCoins, Wallet, NotepadText, Logs } from "lucide-react";

const Stats = ({ userId }) => {
  const dispatch = useDispatch();
  const { summary, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    const today = new Date();
    dispatch(
      fetchDashboardSummary({
        userId,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      })
    );
  }, [dispatch, userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex justify-between items-center animate-pulse">
              <div className="space-y-2 w-2/3">
                <div className="h-4 bg-gray-300 rounded w-3/4 md:w-2/3"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2 md:w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-full md:w-5/6"></div>
              </div>
              <div className="h-10 w-10 md:h-16 md:w-16 bg-gray-300 rounded-lg"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 col-span-12 p-4 bg-[#E5E7EB] rounded-2xl shadow animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="md:col-span-8 col-span-12 p-4 bg-[#E5E7EB] rounded-2xl shadow animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="col-span-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-300 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 font-medium">
          {error.includes("overloaded") ? "The stats service is overloaded right now." : error}
        </p>
      </div>
    );
  }
  if (!summary) {
    return (
      <div className="p-4 text-center text-[#6B7280]">
        No data available for this month.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        <div className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex justify-between items-center">
          <div>
            <h3 className="md:text-lg text-sm font-semibold text-[#111827]">Monthly Spending</h3>
            <p className="md:text-2xl text-lg font-bold text-red-600">
              ₹{summary.monthlySpending.total}
            </p>
            <p className={`md:text-sm text-xs ${
              Number(summary.monthlySpending.change) < 0
                ? 'text-green-500'
                : Number(summary.monthlySpending.change) > 0
                  ? 'text-red-500'
                  : 'text-[#6B7280]'
            }`}>
              {Number(summary.monthlySpending.change) > 0 && <>📈 {summary.monthlySpending.change}% <span className="text-[#6B7280]">vs last month</span></>}
              {Number(summary.monthlySpending.change) < 0 && <>📉 {Math.abs(summary.monthlySpending.change)}% <span className="text-[#6B7280]">vs last month</span></>}
              {Number(summary.monthlySpending.change) === 0 && <>➡️ 0% <span className="text-[#6B7280]">vs last month</span></>}
            </p>
          </div>
          <div className="md:text-4xl text-2xl text-[#2563EB] p-1 bg-white border-2 rounded-lg">
            <ChartNoAxesCombined />
          </div>
        </div>

        <div className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex justify-between items-center">
          <div>
            <h3 className="md:text-lg text-sm font-semibold text-[#111827]">Savings Rate</h3>
            <p className="md:text-2xl text-lg font-bold text-green-600">
              ₹{summary.savingsRate.amount} / ₹{summary.savingsRate.target}
            </p>
            <p className="text-xs md:text-sm text-[#6B7280] mt-1">
              {summary.savingsRate.percent}%{" "}
              {summary.savingsRate.percent >= 75
                ? "On track"
                : summary.savingsRate.percent >= 50
                ? "Needs improvement"
                : "At risk"}
            </p>
          </div>
          <div className="text-4xl text-[#2563EB] p-1 bg-white border-2 rounded-lg">
            <HandCoins />
          </div>
        </div>

        <div className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex justify-between items-center">
          <div className="w-2/3">
            <h3 className="md:text-lg text-sm font-semibold text-[#111827]">Budget Remaining</h3>
            <p className="md:text-2xl text-lg font-bold text-blue-600">
              ₹{summary.budgetRemaining.total}
            </p>
            <div className="flex flex-row-reverse gap-2">
              <p className="md:text-sm text-xs text-[#6B7280]">
                {(summary.budgetRemaining.percentRemaining)}%
              </p>

              <div className="w-full bg-white rounded-full h-3 mt-2">
                <div
                  className={`h-3 rounded-full ${
                    100 - summary.budgetRemaining.percentRemaining >= 100
                      ? "bg-red-500"
                      : 100 - summary.budgetRemaining.percentRemaining >= 80
                      ? "bg-orange-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100 - summary.budgetRemaining.percentRemaining,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="text-4xl text-[#2563EB] p-1 bg-white border-2 rounded-lg">
            <Wallet />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-4 col-span-12 p-4 bg-[#E5E7EB] rounded-2xl shadow flex justify-between items-center">
          <div>
            <h3 className="md:text-lg text-sm font-semibold text-[#111827]">Budget Summary</h3>
            <p className="md:text-sm text-xs text-green-600">
              {summary.budgetSummary.underBudget} categories under budget
            </p>
            <p className="md:text-sm text-xs text-yellow-600">
              {summary.budgetSummary.nearLimit} categories near the limit
            </p>
            <p className="md:text-sm text-xs text-red-600">
              {summary.budgetSummary.overLimit} categories over the limit
            </p>
          </div>
          <div className="text-4xl text-[#2563EB] p-1 bg-white border-2 rounded-lg">
            <NotepadText />
          </div>
        </div>

        <div className="md:col-span-8 col-span-12 p-4 bg-[#E5E7EB] rounded-2xl shadow">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-semibold text-[#111827]">Category Breakdown</h4>
            <div className="text-4xl text-[#2563EB] p-1 bg-white border-2 rounded-lg">
              <Logs />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
            {Object.entries(summary.categoryBreakdown).map(([cat, data]) => {
              const percent = Math.round(data.percent);
              return (
                <div key={cat} className="col-span-1">
                  <p className="text-sm font-medium capitalize text-[#6B7280]">{cat}</p>
                  <div className="w-full bg-white rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        percent >= 100
                          ? "bg-red-500"
                          : percent >= 80
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {percent}%{" "}
                    {percent >= 100
                      ? "(Over budget)"
                      : percent >= 80
                      ? "(Warning)"
                      : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
