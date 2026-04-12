import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSpendingTrend } from "../../api/charts";

export default function SpendingTrendChart({ userId, month, year }) {
  const [data, setData] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    (async () => {
      try {
        const trend = await fetchSpendingTrend(userId, month, year);
        const chartData = trend.map((t) => ({
          name: t.month,
          expense: t.expense,
          income: t.income,
        }));
        setData(chartData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, month, year]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow w-full animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[500px] h-64 sm:h-80 md:h-96 md:min-w-full bg-gray-200 rounded"></div>
        </div>
        <div className="mt-4 h-16 bg-gray-100 rounded"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-red-500">Spent: ₹{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomDot = (props) => {
    const { cx, cy, payload, index } = props;
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={6}
        fill="#2563EB"
        stroke="#fff"
        strokeWidth={2}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
        onClick={() => setSelectedPoint({ month: payload.name, expense: payload.expense })}
      />
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="md:text-lg text-md font-semibold text-gray-800">Spending Trend</h3>
        <p className="text-sm text-gray-500">Last 6 months</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px] h-64 sm:h-80 md:h-96 md:min-w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={3}
                dot={(props) => renderCustomDot({ ...props, pointerEvents: true })}
                activeDot={{ r: 8, fill: "#dc2626", style: { pointerEvents: "none" } }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Month</p>
                <p className="font-semibold text-gray-800">{selectedPoint.month}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">You spent</p>
                <p className="font-semibold text-red-600">₹{selectedPoint.expense}</p>
              </div>
            </div>
            <div className="text-right mt-3">
              <button
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => setSelectedPoint(null)}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}