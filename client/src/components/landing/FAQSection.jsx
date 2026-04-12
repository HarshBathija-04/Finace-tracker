import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Is my financial data secure?",
    answer: "Absolutly. We use bank-level encryption and secure authentication to keep your data safe.",
  },
  {
    question: "Can I connect multiple accounts?",
    answer:
      "Yes, you can track expenses and income across different categories and accounts.",
  },
  {
    question: "Does the platform work on mobile?",
    answer:
      "Our app is fully responsive, so you can manage your finances on any device.",
  },
  {
    question: "How does AI help me save money?",
    answer:
      "Our AI analyzes your spending habits and provides personalized insights, alerts, and tips.",
  },
]
function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id='faqs' className='bg-[#F9FAFB] md:py-16 py-10 px-4'>
      <div className='max-w-3xl mx-auto text-center md:mb-10 mb-6'>
        <h2 className='text-2xl md:text-3xl font-bold text-[#111827]'>
          Frequently Asked Questions
        </h2>
        <p className='text-[#6B7280] md:mt-2 mt-1'>
          Answers to the most common questions about our platform.
        </p>
      </div>
      <div className='max-w-3xl mx-auto space-y-4'>
        {faqs.map((faq, index) => (
          <div
            key={index}
            className='bg-white rounded-xl shadow-sm p-4 cursor-pointer'
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <div className='flex justify-between items-center'>
              <h3 className='font-medium text-[#111827]'>
                {faq.question}
              </h3>
              <ChevronDown className={`w-5 h-5 text-[#6B7280] transition-transform ${openIndex === index ? "rotate-180" : ""}`} />
            </div>
            {openIndex === index && (
              <p className='text-[#6B7280] mt-2 text-sm'>{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default FAQSection
