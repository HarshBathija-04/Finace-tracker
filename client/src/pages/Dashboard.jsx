import { useEffect, useState } from "react";
import Stats from "../components/dashboard/Stats";
import Navbar from "../components/Navbar";
import SpendingTrendChart from "../components/charts/SpendingTrendChart";
import CategoryBreakdownChart from "../components/charts/CategoryBreakdownChart";
import { fetchSpendingTrend, fetchCategoryBreakdown } from "../api/charts";
import { useSelector } from "react-redux";
import AiInsightsCard from "../components/reports/AiInsightsCard";
import RecentTransactionTable from "../components/dashboard/RecentTransactionTable";

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="md:px-16 px-2 mt-4">
        <h2 className="md:text-2xl text-lg font-bold mb-4">Dashboard</h2>
        <Stats userId={user._id} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SpendingTrendChart userId={user._id} month={month} year={year} />
          <CategoryBreakdownChart userId={user._id} month={month} year={year} />
        </div>
        <AiInsightsCard userId={user._id} month={month} year={year} />
        <RecentTransactionTable />
      </div>
    </div>
  )
}

export default Dashboard
