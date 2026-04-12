import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTransaction, uploadReceipt } from '../redux/slices/transactionSlices';
import { Banknote, CloudUpload, X } from "lucide-react";
import { useEffect } from 'react';

const AddExpenseModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { loading, uploading, extracted } = useSelector((state) => state.transactions);

  const [form, setForm] = useState({
    amount: "",
    type: "expense",
    category: "",
    date: new Date().toISOString().split("T")[0],
    payment: "cash",
    note: "",
    recurring: {
      isRecurring: false,
      frequency: "",
      endDate: "",
    },
  });

  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if(extracted) {
      setForm((prev) => ({
        ...prev,
        ...extracted,
      }));
    }
  }, [extracted]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if(name === "isRecurring") {
      setForm({
        ...form,
        recurring: { ...form.recurring, isRecurring: checked },
      });
    } else if(["frequency", "endDate"].includes(name)) {
      setForm({
        ...form,
        recurring: { ...form.recurring, [name]: value },
      });
    } else {
      setForm({ ...form, [name]: type === "number" ? Number(value) : value });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if(file) {
      setReceipt(file);
      setPreview(URL.createObjectURL(file));
      await dispatch(uploadReceipt(file));
    }
  };

  useEffect(() => {
    return () => {
      if(preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const receiptUrl = extracted?.url || null;

    const transactionData = {
      ...form,
      receipt: receiptUrl,
    };

    if (!transactionData.recurring.isRecurring) {
      delete transactionData.recurring.frequency;
      delete transactionData.recurring.endDate;
    } else {
      if (!transactionData.recurring.frequency) {
        delete transactionData.recurring.frequency; // avoid sending ""
      }
      if (!transactionData.recurring.endDate) {
        delete transactionData.recurring.endDate;
      }
    }

    await dispatch(addTransaction(transactionData));

    setForm({
      amount: "",
      type: "expense",
      category: "",
      date: new Date().toISOString().split("T")[0],
      payment: "cash",
      note: "",
      recurring: {
        isRecurring: false,
        frequency: "",
        endDate: "",
      },
    });

    setReceipt(null);
    onClose();
  }

  if(!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-screen overflow-y-auto'>
        <X onClick={onClose} className='text-white bg-black rounded-full p-1 h-6 w-6' />
        <div className='flex flex-col items-center'>
          <Banknote className='h-8 w-8 text-[#2563EB]' />
          <h2 className='text-xl font-bold mb-4'>Add Transaction</h2>
        </div>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-gray-700 font-semibold'>Amount</label>
            <input 
              type="number" name="amount" value={form.amount} required
              onChange={handleChange} className='w-full border rounded-md p-2 outline-0'
              placeholder='Enter Amount'
            />
          </div>
          <div>
            <label className='block text-gray-700 font-semibold'>Type</label>
            <select 
              name="type" value={form.type}
              onChange={handleChange} className='w-full border rounded-md p-2 outline-0'
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className='block text-gray-700 font-semibold'>Category</label>
            <input 
              type="text" name="category" value={form.category} required
              onChange={handleChange} className='w-full border rounded-md p-2 outline-0'
              placeholder='e.g. Shopping'
            />
          </div>
          <div>
            <label className='block text-gray-700 font-semibold'>Date</label>
            <input 
              type="date" name="date" value={form.date} required
              onChange={handleChange} className='w-full border rounded-md p-2 outline-0'
            />
          </div>
          <div>
            <label className='block text-gray-700 font-semibold'>Payment Method</label>
            <select 
              name="payment" value={form.payment}
              onChange={handleChange} className='w-full border rounded-md p-2 outline-0'
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div>
            <label className='block text-gray-700 font-semibold'>Notes</label>
            <textarea 
              name="note" value={form.note}
              onChange={handleChange} className='w-full border rounded-md p-2 outline-0'
              placeholder='Optional note'
            />
          </div>
          <div className='space-y-2'>
            <label className='flex items-center space-x-2'>
              <input type="checkbox" name='isRecurring' checked={form.recurring.isRecurring} onChange={handleChange} />
              <span className='text-gray-700'>Recurring Transaction</span>
            </label>
            {form.recurring.isRecurring && (
              <div className='grid grid-cols-2 gap-2'>
                <select 
                  name="frequency" value={form.recurring.frequency} 
                  onChange={handleChange} className='w-full border rounded-md p-2 outline-0'
                >
                  <option value="">Select Frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <input
                  type="date" name="endDate" value={form.recurring.endDate}
                  onChange={handleChange} className='w-full border rounded-md p-2 outline-0'
                />
              </div>
            )}
          </div>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-3 text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className='w-full'>
            <label className='block text-gray-700 font-semibold mb-2'>Upload Receipt</label>
            <label
              htmlFor="receipt-upload"
              className="w-full border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center p-6 cursor-pointer hover:border-blue-500 transition duration-300"
            >
              <CloudUpload className='text-[#2563EB]' />
              <span className="text-red-500 font-medium">Click here to upload</span>
              <input
                id="receipt-upload"
                type="file"
                accept=".jpg,.png,.jpeg,.webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploading && (
              <p className="text-sm text-blue-500 mt-2 text-center">Uploading receipt...</p>
            )}

            {preview && (
              <div className='mt-3 flex justify-center'>
                <img src={preview} alt="Receipt Preview" className='w-56 h-full rounded-md border' />
              </div>
            )}

          </div>
          <div className='flex justify-center space-x-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 w-full py-2 rounded bg-gray-200 hover:bg-red-500 duration-300'
            >
              CANCEL
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-4 py-2 w-full rounded bg-[#2563EB] text-white hover:bg-blue-700 duration-300'
            >
              {loading ? (
                <div className='flex justify-center items-center'>
                  <span>Saving</span>
                  <div className="ml-2 border-2 h-4 w-4 rounded-full border-b-transparent animate-spin text-white"></div>
                </div>
                ) : "ADD"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddExpenseModal
