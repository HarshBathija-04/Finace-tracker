import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoutes from "./components/ProtectedRoutes";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Signup";
import Dashboard from "./pages/Dashboard"; 
import ExpenseList from "./pages/ExpenseList";
import Reports from "./pages/Reports";
import ProfileSettings from "./pages/ProfileSettings";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "./redux/slices/notificationSlice";

import { initSocket, getSocket } from "./socket";

function App() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      const socket = initSocket(localStorage.getItem("token"));
      socket.emit("register", user._id);

      socket.on("newNotification", (notif) => {
        dispatch(addNotification(notif));
      });

      return () => {
        socket.off("newNotification");
      };
    }
  }, [user, dispatch]);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoutes> <Dashboard /> </ProtectedRoutes>} />
        <Route path="/expense-list" element={<ProtectedRoutes> <ExpenseList /> </ProtectedRoutes>} />
        <Route path="/reports" element={<ProtectedRoutes> <Reports /> </ProtectedRoutes>} />
        <Route path="/settings" element={<ProtectedRoutes> <ProfileSettings /> </ProtectedRoutes>} />
      </Routes>
    </Router>
  )
}

export default App
