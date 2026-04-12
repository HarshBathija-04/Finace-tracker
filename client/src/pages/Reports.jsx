import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReportsSummary, fetchIncomeVsExpenseTrend } from '../redux/slices/reportSlice';
import StatsCards from '../components/reports/StatsCards';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';
import CategoryBreakdownChart from '../components/charts/CategoryBreakdownChart';
import IncomeVsExpenseChart from '../components/charts/IncomeVsExpenseChart';
import AiInsightsCard from '../components/reports/AiInsightsCard';
import Navbar from '../components/Navbar';

function Reports() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { summary, trend, loading, error } = useSelector((state) => state.reports);

  const userId = user._id;
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  useEffect(() => {
    dispatch(fetchReportsSummary({ userId, month, year }));
    dispatch(fetchIncomeVsExpenseTrend(userId));
  }, [dispatch]);

  if (error) {
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  }


  return (
    <div>
      <Navbar />
      <div className="md:px-16 px-2 my-4">
        <h2 className="md:text-2xl text-lg font-bold mb-4">Reports</h2>
        <StatsCards summary={summary} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SpendingTrendChart userId={user._id} month={month} year={year} />
          <CategoryBreakdownChart userId={user._id} month={month} year={year} />
        </div>

        <div className='mt-6'>
          {trend && trend.length > 0 && <IncomeVsExpenseChart data={trend} loading={loading} />}
        </div>
        
        <AiInsightsCard userId={user._id} month={month} year={year} />
      </div>
    </div>
  )
}

export default Reports
