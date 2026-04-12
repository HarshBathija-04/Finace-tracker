import { BarChart3, Bell, Wallet, Shield } from "lucide-react";

const features = [
  {
    icon: <Wallet className="w-8 h-8 text-[#2563EB]" />,
    title: "Smart Expense Tracking",
    description: "Log and categorize your expenses with ease. Get clear visibility into where your money is going.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-[#2563EB]" />,
    title: "AI-Powered Insights",
    description:
      "Receive personalized financial tips and alerts to stay within your budget and achieve your goals.",
  },
  {
    icon: <Bell className="w-8 h-8 text-[#2563EB]" />,
    title: "Real-Time Notifications",
    description:
      "Stay updated with instant alerts for income, spending, and budget thresholds.",
  },
  {
    icon: <Shield className="w-8 h-8 text-[#2563EB]" />,
    title: "Bank-Level Security",
    description:
      "Your data is safe with advanced encryption and secure authentication.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-[#F9FAFB] md:py-16 py-10 px-4">
      <div className="max-w-6xl mx-auto text-center md:mb-12 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">
          Powerful Features, All in One Place
        </h2>
        <p className="text-[#6B7280] md:mt-4 mt-2">
          From simple tracking to advanced insights, our platform is designed 
          to make your financial journey effortless.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid md:gap-8 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition"
          >
            <div className="md:mb-4 mb-2 flex items-center justify-center">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-[#111827] md:mb-2 mb-1">
              {feature.title}
            </h3>
            <p className="text-[#6B7280] text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features
