import dashboard from "../../assets/dashboard.png"
import expenses from "../../assets/expenses.png"
import reports from "../../assets/reports.png"
import notifications from "../../assets/notifications.png"

const screenshots = [
  { id: 1, src: dashboard, alt: "Dashboard Preview" },
  { id: 2, src: expenses, alt: "Transactions Preview" },
  { id: 3, src: notifications, alt: "Alerts Preview" },
  { id: 4, src: reports, alt: "Reports Preview" },
];

function Preview() {
  return (
    <section id="preview" className="bg-[#F9FAFB] md:py-16 py-10 px-4 text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-[#111827] md:mb-4 mb-2">
        See What's inside
      </h2>
      <p className="text-[#6B7280] max-w-xl mx-auto md:mb-10 mb-6">
        Get a quick glimpse of powerful dashboards, detailed reports, and tools 
        designed to keep your finances under control.
      </p>

      <div className="grid md:grid-cols-2 grid-cols-1 gap-2 md:gap-6 max-w-4xl mx-auto">
        {screenshots.map((shot) => (
          <div key={shot.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-transform transform hover:scale-105 overflow-hidden">
            <img src={shot.src} alt={shot.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default Preview
