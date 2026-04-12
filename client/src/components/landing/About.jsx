import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import { SquareArrowOutUpRight } from "lucide-react";

function About() {
  return (
    <section id="about" className='bg-[#ffffff] md:py-16 py-10 px-4'>
      <div className='max-w-6xl mx-auto grid md:grid-cols-2 md:gap-12 gap-6 items-center'>
        <div>
          <h2 className='text-2xl md:text-3xl font-bold text-[#111827] md:mb-4 mb-2 text-center'>
            About Our Platform
          </h2>
          <p className="text-[#6B7280] leading-relaxed md:mb-6 mb-4">
            We built this platform to help you take control of your money in a 
            smarter way. From tracking daily expenses to setting personalized budgets 
            and receiving AI-powered insights, everything you need is in one place. 
          </p>
          <p className="text-[#6B7280] leading-relaxed md:mb-6 mb-4">
            With advanced analytics, real-time notifications, and intuitive 
            dashboards, managing your personal finances has never been easier.
          </p>
          <Link to="/register" className="text-[#2563EB] text-sm flex items-center">
            Get Started <SquareArrowOutUpRight className="h-4" />
          </Link>
        </div>
        <div className='flex justify-center'>
          <div className='bg-[#E5E7EB] h-full w-full md:w-96 rounded-2xl flex items-center justify-center text-[#6B7280]'>
            <img src={logo} alt="LOGO" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
