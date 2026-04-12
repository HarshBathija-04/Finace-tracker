import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function ProtectedRoutes({ children }) {
  const { user, token } = useSelector((state) => state.auth);

  if(!user || !token) {
    return <Navigate to="/login" replace />
  }

  return children;
}

export default ProtectedRoutes
