import { Coins, ChartLine, Bot, CreditCard, PiggyBank, DollarSign, TrendingUp, Brain } from "lucide-react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="px-6 py-12 text-center md:py-20 bg-gradient-to-b from-white to-[#F9FAFB] relative">
      <h1 className="md:text-6xl text-4xl font-extrabold text-[#111827] leading-tight">
        Smarter Money Management <br />
        <span className="text-[#2563EB]">Starts Here</span>
      </h1>

      <p className="mt-4 text-sm text-[#6B7280] md:text-lg md:mt-6 max-w-xl mx-auto">
        Take control of your spending, manage budgets, and stay on top of your money with ease.
        Your personal AI-finance companion, built for you.
      </p>

      <div className="mt-6 flex justify-center gap-3">
        <Link to="/register" className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#2563EB] text-white shadow-md hover:opacity-90 transition duration-300">
          Get Started
        </Link>
        <a href="#preview" className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition duration-300">
          Preview
        </a>
      </div>

      <Coins className="hidden md:block absolute top-6 left-24 h-8 w-8 text-yellow-400 animate-bounce" />
      <ChartLine className="hidden md:block absolute bottom-6 right-6 h-6 w-6 text-green-500 animate-pulse" />
      <Bot className="hidden md:block absolute top-4 right-10 h-6 w-6 text-blue-400 animate-bounce" />
      <CreditCard className="hidden lg:block absolute top-44 left-12 h-6 w-6 text-purple-400 animate-pulse" />
      <PiggyBank className="hidden lg:block absolute bottom-16 left-8 h-7 w-7 text-pink-400 animate-bounce" />
      {/* <DollarSign className="hidden md:block absolute top-24 left-1/2 h-5 w-5 text-green-600 animate-pulse" /> */}
      <TrendingUp className="hidden lg:block absolute bottom-20 right-1/3 h-6 w-6 text-blue-500 animate-bounce" />
      <Brain className="hidden lg:block absolute top-28 right-20 h-8 w-8 text-indigo-400 animate-spin-slow" />
    </section>
  )
}

export default Hero
