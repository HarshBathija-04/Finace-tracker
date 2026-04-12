import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTransactions } from "../../redux/slices/transactionSlices";

const RecentTransactionsTable = () => {
  const { transactions, loading, error } = useSelector(
    (state) => state.transactions
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="my-4">
      <h2 className="md:text-lg text-md font-semibold mb-4">Recent Transactions</h2>

      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#E5E7EB] text-left text-sm font-medium uppercase text-[#2563EB]">
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Category</th>
              <th className="py-2 px-4">Payment</th>
              <th className="py-2 px-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {
              loading ? (
                [...Array(5)].map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </td>
                </tr>
              ))
            ) : recentTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-4 px-4 text-center text-[#6B7280]"
                >
                  No transactions yet.
                </td>
              </tr>
            ) : (
              recentTransactions.map((tx) => (
                <tr
                  key={tx._id}
                  className="hover:bg-gray-100 text-sm capitalize text-[#6B7280] bg-[#FFFFFF]"
                >
                  <td className="py-2 px-4">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td
                    className={`py-2 px-4 font-semibold ${
                      tx.type === "expense" ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {tx.type === "expense" ? "-" : "+"}₹{tx.amount}
                  </td>
                  <td className="py-2 px-4">{tx.category}</td>
                  <td className="py-2 px-4 capitalize">{tx.payment}</td>
                  <td className="py-2 px-4 truncate max-w-[150px]">
                    {tx.note || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => navigate("/expense-list")}
          className="text-[#2563EB] hover:underline text-xs md:text-sm font-medium"
        >
          Show More →
        </button>
      </div>
    </div>
  );
};

export default RecentTransactionsTable;
