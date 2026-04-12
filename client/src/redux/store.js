import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import transactionReducer from "./slices/transactionSlices";
import dashboardReducer from "./slices/dashboardSlice";
import reportReducer from "./slices/reportSlice";
import profileReducer from "./slices/profileSlice";
import budgetReducer from "./slices/budgetSlice";
import notificationSettingsReducer from "./slices/notificationSettingsSlice";
import notificationReducer from "./slices/notificationSlice";


const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
    dashboard: dashboardReducer,
    reports: reportReducer,
    notificationSettings: notificationSettingsReducer,
    profile: profileReducer,
    budget: budgetReducer,
    notifications: notificationReducer,
  },
});

export default store;