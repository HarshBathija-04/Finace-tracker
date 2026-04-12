import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteTransaction, fetchTransactions } from '../redux/slices/transactionSlices';
import EditTransactionModal from '../components/EditTransactionModal';
import Navbar from '../components/Navbar';
import { ArrowUpDown, Funnel, Pencil, Search, Trash } from 'lucide-react';

const categories = ["Groceries", "Food", "Transport", "Entertainment", 'Bills', "Other"];
const paymentMethods = ["cash", "upi", "card"];
const amountRanges = [
  { label: "Below ₹500", min: 0, max: 500 },
  { label: "₹500 - ₹2000", min: 500, max: 2000 },
  { label: "Above ₹2000", min: 2000, max: Infinity },
];

function ExpenseList() {
  const { transactions, loading } = useSelector((state) => state.transactions);
  const dispatch = useDispatch();

  const [editingTx, setEditingTx] = useState(null);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedAmounts, setSelectedAmounts] = useState([]);
  const [sortBy, setSortBy] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const [message, setMessage] = useState("");
  const [deletingIds, setDeletingIds] = useState([]);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const filteredTransactions = transactions.filter((tx) => {
    if(search && !tx.category.toLowerCase().includes(search.toLowerCase()) && !tx.note?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    const txDate = new Date(tx.date);
    const today = new Date();
    if(dateRange === "today" && txDate.toDateString() !== today.toDateString()) return false;
    if(dateRange === "thisWeek") {
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      if(txDate < startOfWeek) return false;
    }
    if(dateRange === "thisMonth" && txDate.getMonth() !== new Date().getMonth()) return false;
    if(dateRange === "prevMonth") {
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      if(txDate.getMonth() !== prevMonth.getMonth()) return false;
    }

    if (selectedCategories.length > 0) {
      const txCategoryLower = tx.category.toLowerCase();
      const selectedLower = selectedCategories.map(c => c.toLowerCase());
      if (!selectedLower.includes(txCategoryLower)) return false;
    }

    if(selectedPayments.length > 0 && !selectedPayments.includes(tx.payment)) return false;

    if(selectedAmounts.length > 0) {
      let inRange = false;
      for(const range of selectedAmounts) {
        if(tx.amount >= range.min && tx.amount <= range.max) {
          inRange = true;
          break;
        }
      }
      if(!inRange) return false;
    }

    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if(sortBy === "newest") return new Date(b.date) - new Date(a.date);
    if(sortBy === "oldest") return new Date(a.date) - new Date(b.date);
    if(sortBy === "lowToHigh") return a.amount - b.amount;
    if(sortBy === "highToLow") return b.amount - a.amount;
    return 0;
  });

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const togglePayment = (p) => {
    setSelectedPayments((prev) =>
      prev.includes(p) ? prev.filter((c) => c !== p) : [...prev, p]
    );
  };

  const toggleAmount = (range) => {
    setSelectedAmounts((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );
  };

  const handleDelete = async (id) => {
    setDeletingIds((prev) => [...prev, id]);
    try {
      await dispatch(deleteTransaction(id)).unwrap();
      dispatch(fetchTransactions());
      setMessage("transaction deleted successfully!");
      setTimeout(() => {setMessage("")}, 3000);
    } catch (error) {
      console.log("Failed to delete", error);
      setMessage("Failed to delete transaction");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setDeletingIds((prev) => prev.filter((delId) => delId !== id));
    }
  };

  return (
    <div>
      <Navbar />
      <div className="md:px-16 px-2 my-4 bg-gray-50 min-h-screen">
        <h1 className="md:text-2xl text-lg font-bold mb-4">Expense List</h1>

        {/* Search + Buttons */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-1/3">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className='h-5 w-5' />
            </span>
            <input
              type="text"
              placeholder="Search by category or notes..."
              className="border rounded-lg p-2 pl-10 w-full md:text-base text-sm outline-0 focus:border-[#2563EB] text-[#6B7280]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>


          <div className='flex gap-4'>
            <button
              className="border px-4 py-2 rounded-lg md:text-base text-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>
                <Funnel className='h-4 w-4' />
              </span>
              Filters
            </button>
            <button
              className="border px-4 py-2 rounded-lg md:text-base text-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
              onClick={() => setShowSort(!showSort)}
            >
              <span>
                <ArrowUpDown className='h-4 w-4' />
              </span>
              Sort
            </button>
          </div>
        </div>

        {/* Filters Dropdown */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md grid md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-medium mb-2">Date Range</h3>
              <div className="flex flex-wrap gap-2">
                {["today", "thisWeek", "thisMonth", "prevMonth"].map((range) => {
                  const labels = {
                    today: "Today",
                    thisWeek: "This Week",
                    thisMonth: "This Month",
                    prevMonth: "Previous Month"
                  };
                  return (
                    <button
                      key={range}
                      className={`px-3 py-1 rounded-full border ${
                        dateRange === range
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => setDateRange(dateRange === range ? "" : range)}
                    >
                      {labels[range]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Category</h3>
              {categories.map((cat) => (
                <label key={cat} className="block">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="mr-2"
                  />
                  {cat}
                </label>
              ))}
            </div>

            <div>
              <h3 className="font-medium mb-2">Payment Method</h3>
              {paymentMethods.map((p) => (
                <label key={p} className="block capitalize">
                  <input
                    type="checkbox"
                    checked={selectedPayments.includes(p)}
                    onChange={() => togglePayment(p)}
                    className="mr-2"
                  />
                  {p}
                </label>
              ))}
            </div>

            <div>
              <h3 className="font-medium mb-2">Amount Range</h3>
              {amountRanges.map((range) => (
                <label key={range.label} className="block">
                  <input
                    type="checkbox"
                    checked={selectedAmounts.includes(range)}
                    onChange={() => toggleAmount(range)}
                    className="mr-2"
                  />
                  {range.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Sort Dropdown */}
        {showSort && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md w-full md:w-1/3">
            <h3 className="font-medium mb-2">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-lg p-2 w-full"
            >
              <option value="">None</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
            </select>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            {message}
          </div>
        )}
        {/* Table */}
        <div className="bg-white overflow-x-auto rounded-lg shadow">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                <th className="py-2 px-4 uppercase">Date</th>
                <th className="py-2 px-4 uppercase">Amount</th>
                <th className="py-2 px-4 uppercase">Category</th>
                <th className="py-2 px-4 uppercase">Payment</th>
                <th className="py-2 px-4 uppercase">Notes</th>
                <th className="py-2 px-4 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ?
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="border-b animate-pulse">
                      {Array.from({ length: 6 }).map((__, i) => (
                        <td
                          key={i}
                          className="py-2 px-4 h-10 bg-gray-200 rounded"
                        />
                      ))}
                    </tr>
                  ))
                : sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((tx) => (
                    <tr
                      key={tx._id}
                      className=" hover:bg-gray-50 text-sm text-gray-700"
                    >
                      <td className="py-2 px-4">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className={`py-2 px-4 font-semibold ${tx.type === "expense" ? "text-red-500" : "text-green-500"}`}>
                        {tx.type === "expense" ? "-" : "+"}₹{tx.amount}
                      </td>
                      <td className="py-2 px-4">{tx.category}</td>
                      <td className="py-2 px-4 capitalize">{tx.payment}</td>
                      <td className="py-2 px-4 truncate max-w-[150px]">{tx.note || "-"}</td>
                      <td className="py-2 px-4 flex gap-2 items-center">
                        <button className="text-blue-600 hover:bg-gray-200 p-2 rounded-full duration-300" onClick={() => setEditingTx(tx)}>
                          <Pencil className='h-4 w-4' />
                        </button>
                        {deletingIds.includes(tx._id) ? (
                          <div className="border-2 h-5 w-5 rounded-full border-b-transparent animate-spin text-red-500"></div>
                        ) : (
                          <button className="text-red-600 hover:bg-gray-200 p-2 rounded-full duration-300" onClick={() => handleDelete(tx._id)}>
                            <Trash className='h-4 w-4' />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
          <EditTransactionModal
            isOpen={!!editingTx}
            onClose={() => setEditingTx(null)}
            transaction={editingTx}
            onUpdated={() => {
              dispatch(fetchTransactions());
              setMessage("Transaction updated successfully!");
              setTimeout(() => {setMessage("")}, 3000);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ExpenseList;
