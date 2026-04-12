import { TrendingUp, ShieldCheck, BarChart3 } from "lucide-react";

function FeaturesHighlights() {
  const features = [
    {
      icon: <TrendingUp className="w-8 h-8 text-[#2563EB]" />,
      title: "Smart Expense Traking",
      desc: "Easily log and categorize expenses with insightful breakdowns.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-[#2563EB]" />,
      title: "Secure & Private",
      desc: "Your financial data is encrypted and always safe with us.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-[#2563EB]" />,
      title: "Powerful Insights",
      desc: "Visual dashboards & AI-powered reports to help you stay ahead.",
    },
  ]
  return (
    <section className="px-4 md:py-12 py-8 bg-[#F9FAFB]">
      <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3 text-center">
        {features.map((feature, index) => (
          <div
            key={index}
            className="md:p-6 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-center md:mb-4 mb-2">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-[#111827] md:mb-2 mb-1">
              {feature.title}
            </h3>
            <p className="text-sm text-[#6B7280]">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeaturesHighlights
