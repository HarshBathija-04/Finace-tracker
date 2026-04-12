import React, { useState } from 'react';
import { fetchAiInsights } from '../../api/reports';
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion"; 

function AiInsightsCards({ userId, month, year }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadInsights = async () => {
    if (!userId || loaded) return;
    try {
      setLoading(true);
      const data = await fetchAiInsights(userId, month, year);

      let insightsData = [];
      if (Array.isArray(data)) {
        insightsData = data;
      } else if (typeof data === "string") {
        insightsData = data
          .split("\n")
          .map(line => line.trim())
          .filter(Boolean);
      }

      setInsights(insightsData);
      setLoaded(true);
    } catch (error) {
      console.log("Error fetching AI insights:", error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mt-4'>
      <div>
        <h3 className="md:text-lg text-md font-semibold text-gray-800">Gemini's Financial Insights</h3>
        <p className="text-sm text-gray-500 mt-1 mb-2">AI-powered personalized financial advice</p>
      </div>
      {!loaded && !loading && (
        <div className="flex justify-center items-center py-16">
          <button
            onClick={loadInsights}
            className="md:px-6 md:py-3 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium shadow-md"
          >
            Generate Insights
          </button>
        </div>
      )}

      {loading && (
        <div className="grid md:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && loaded && insights.length === 0 && (
        <p className="text-center text-[#6B7280]">No insights available for this period.</p>
      )}

      {!loading && insights.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {insights.map((tip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 bg-[#E5E7EB] rounded-2xl shadow flex flex-col justify-between"
            >
              <div>
                <div className='flex justify-between items-center'>
                  <h3 className="md:text-lg text-sm font-semibold text-[#111827]">
                    Insight {idx + 1}
                  </h3>
                  <div className="text-[#2563EB] p-1 bg-white border-2 rounded-lg">
                    <Sparkles className='h-5 w-5' />
                  </div>
                </div>
                <p className="md:text-sm text-xs text-[#6B7280] mt-2">
                  {tip}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AiInsightsCards;
