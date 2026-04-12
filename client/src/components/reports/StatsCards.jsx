import React from "react";
import { PiggyBank, TrendingUp, TrendingDown, Wallet } from "lucide-react";

function StatsCards({ summary, loading }) {
  if(loading || !summary) {
    return (
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
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex justify-between items-center">
        <div>
          <h3 className="md:text-lg text-sm font-semibold text-[#111827]">
            Biggest Spending
          </h3>
          <p className="md:text-2xl text-lg font-bold text-red-600">
            {summary.biggestSpendingCategory.category} - ₹{summary.biggestSpendingCategory.amount}
          </p>
          <p></p>
        </div>
        <div className="md:text-4xl text-2xl text-[#2563EB] p-1 bg-white border-2 rounded-lg">
          <Wallet />
        </div>
      </div>

      <div className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex justify-between items-center">
        <div>
          <h3 className="md:text-lg text-sm font-semibold text-[#111827]">
            Savings vs Last Month
          </h3>
          <p className="md:text-2xl text-lg font-bold text-red-600">
            ₹{summary.totalSavingsVsLastMonth.current}
          </p>
          <p className={`text-xs ${
            summary.totalSavingsVsLastMonth.change >= 0 ? "text-green-500" : "text-red-500"
          }`}>
            {summary.totalSavingsVsLastMonth.change >= 0 ? "📈" : "📉"} {Math.abs(summary.totalSavingsVsLastMonth.change)}% vs last month
          </p>
        </div>
        <div className="md:text-4xl text-2xl text-[#2563EB] p-1 bg-white border-2 rounded-lg">
          <PiggyBank />
        </div>
      </div>

      <div className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex justify-between items-center">
        <div>
          <h3 className="md:text-lg text-sm font-semibold text-[#111827]">
            Avg Daily Spend
          </h3>
          <p className="md:text-2xl text-lg font-bold text-red-600">
            ₹{summary.avgDailySpend.current}/day
          </p>
          <p className={`text-xs ${
            summary.avgDailySpend.change >= 0 ? "text-red-500" : "text-green-500"
          }`}>
            {summary.avgDailySpend.change >= 0 ? "📈" : "📉"} {Math.abs(summary.avgDailySpend.change)}% vs last month
          </p>
        </div>
        <div className="md:text-4xl text-2xl p-1 bg-white border-2 border-[#2563EB] rounded-lg">
          {summary.avgDailySpend.change >= 0 ? (
            <TrendingUp className="text-red-500" />
          ) : (
            <TrendingDown className="text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsCards;
