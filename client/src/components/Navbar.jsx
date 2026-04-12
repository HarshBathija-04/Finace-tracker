import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { fetchNotifications } from '../redux/slices/notificationSlice';
import { motion } from 'framer-motion';
import { Bell, CircleUser, House, CirclePlus, List, ChartNoAxesColumnIncreasing, Settings, LogOut, Menu, X, Satellite } from "lucide-react";
import logo from "../assets/logo.png";

import AddExpenseModal from "./AddExpenseModal";
import NotificationsModal from './NotificationsModal';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  }

  useEffect(() => {
    if(user._id) {
      dispatch(fetchNotifications(user._id));
    }
  }, [user._id, dispatch]);

  return (
    <nav className='relative bg-white shadow-md md:px-16 md:py-3 px-2 py-2 flex items-center justify-between'>
      <Link to="/" className='inline-flex items-center'>
        <img src={logo} className='md:w-15 w-10 h-full' alt="" />
        <h1 className='md:font-bold font-semibold md:text-2xl text-lg text-[#2563EB]'>FinSight</h1>
      </Link>

      <div className='hidden md:flex space-x-8'>
        <Link to="/dashboard">
          <div className='flex flex-col items-center hover:text-[#2563EB]'>
            <House className='w-5 h-5' />
            <p className='text-xs'>DASHBOARD</p>
          </div>
        </Link>
        <button onClick={() => setModalOpen(true)}>
          <div className='flex flex-col items-center hover:text-[#2563EB] cursor-pointer'>
            <CirclePlus className='w-5 h-5' />
            <p className='text-xs'>ADD EXPENSE</p>
          </div>
        </button>
        <Link to="/expense-list">
          <div className='flex flex-col items-center hover:text-[#2563EB]'>
            <List className='w-5 h-5' />
            <p className='text-xs'>EXPENSE LIST</p>
          </div>
        </Link>
        <Link to="/reports">
          <div className='flex flex-col items-center hover:text-[#2563EB]'>
            <ChartNoAxesColumnIncreasing className='w-5 h-5' />
            <p className='text-xs'>REPORTS</p>
          </div>
        </Link>
      </div>

      <div className='flex items-center space-x-4 relative'>
        <button onClick={() => setOpen(true)} className='relative'>
          <Bell className='w-5 h-5 hover:text-[#2563EB]' />
          {unreadCount > 0 && (
            <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1'>
              {unreadCount}
            </span>
          )}
        </button>

        <div className='relative hidden md:block'>
          <button onClick={() => setDropdownOpen(!isDropdownOpen)} className='flex items-center space-x-1'>
            <CircleUser className='w-5 h-5' />
          </button>
          {isDropdownOpen && (
            <div className='absolute right-0 w-36 mt-2 bg-white shadow-lg rounded-md p-2'>
              <div className='flex gap-2 items-center'>
                <CircleUser className='w-8 h-8 text-[#2563EB]' />
                <div className='flex flex-col'>
                  <p className='text-xs'>HEY,</p>
                  <p className='text-sm'>{user?.name.length >= 14 ? user?.name.split(" ")[0] || "User" : user?.name || "User"}</p>
                </div>
              </div>
              <hr className='mt-2' />
              <div className='flex flex-col items-center'>
                <Link to="/settings" className='block px-4 py-2'>
                  <button className='px-2 py-1 font-medium hover:bg-[#2563EB] hover:text-white rounded-md flex items-center gap-1 cursor-pointer'>
                    <Settings className='w-5 h-5' />
                    <span>SETTINGS</span>
                  </button>
                </Link>
                <button onClick={handleLogout} className='px-2 py-1 font-medium hover:bg-red-500 hover:text-white rounded-md flex items-center gap-1 cursor-pointer'>
                  <LogOut className='w-5 h-5' />
                  <span>LOGOUT</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button className='md:hidden' onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
        </button>
      </div>

      {open && <NotificationsModal onClose={() => setOpen(false)} />}

      {menuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className='absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 md:hidden z-40'
        >
          <div className='flex items-center px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100'>
            <div className='flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 mr-3'>
              <CircleUser className='h-6 w-6 text-blue-600' />
            </div>
            <div className='flex flex-col'>
              <p className='text-xs text-blue-600 font-medium'>HEY,</p>
              <p className='text-sm font-semibold text-gray-800'>
                {user?.name && user.name.length >= 14 
                  ? user.name.split(" ")[0] || "User" 
                  : user?.name || "User"
                }
              </p>
            </div>
          </div>

          <div className='py-2'>
            <Link 
              to="/dashboard" 
              onClick={() => setMenuOpen(false)}
              className='flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group'
            >
              <House className='h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-600' />
              Dashboard
            </Link>

            <button 
              onClick={() => { setModalOpen(true); setMenuOpen(false); }}
              className='flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group w-full text-left'
            >
              <CirclePlus className='h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-600' />
              Add Expense
            </button>

            <Link 
              to="/expense-list" 
              onClick={() => setMenuOpen(false)}
              className='flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group'
            >
              <List className='h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-600' />
              Expense List
            </Link>

            <Link 
              to="/reports" 
              onClick={() => setMenuOpen(false)}
              className='flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group'
            >
              <ChartNoAxesColumnIncreasing className='h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-600' />
              Reports
            </Link>

            <Link 
              to="/settings" 
              onClick={() => setMenuOpen(false)}
              className='flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group'
            >
              <Settings className='h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-600' />
              Settings
            </Link>

            <div className='border-t border-gray-100 my-2'></div>

            <button 
              onClick={handleLogout} 
              className='flex items-center px-6 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group w-full text-left'
            >
              <LogOut className='h-5 w-5 mr-3' />
              Logout
            </button>
          </div>
        </motion.div>
      )}

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </nav>
  )
}

export default Navbar
