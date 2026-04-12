import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

function LandingNavbar() {
  return (
    <nav className="flex items-center justify-between md:px-16 md:py-3 px-2 py-2 bg-white shadow-md">
      <div className="inline-flex items-center">
        <img src={logo} className="md:w-15 w-10 h-full" alt="LOGO" />
        <h1 className="md:font-bold font-semibold md:text-3xl text-xl text-[#2563EB]">FinSight</h1>
      </div>

      <div className="space-x-2">
        <Link to="/login" className="md:px-4 md:py-2 px-2 py-1 text-base font-medium text-[#111827] border border-[#2563EB] rounded-lg hover:bg-[#2563EB] hover:text-white transition duration-300">
          Login
        </Link>
        <Link to="/register" className="md:px-4 md:py-2 px-2 py-1 text-base font-medium text-white rounded-lg bg-[#2563EB] hover:opacity-90 transition duration-300">
          Sign Up
        </Link>
      </div>
    </nav>
  )
}

export default LandingNavbar
