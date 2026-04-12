import LandingNavbar from "../components/landing/LandingNavbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Preview from "../components/landing/Preview";
import About from "../components/landing/About";
import LandingFooter from "../components/landing/LandingFooter";
import FeaturesHighlights from "../components/landing/FeaturesHighlights";
import FAQSection from "../components/landing/FAQSection";

function Landing() {
  return (
    <div>
      <LandingNavbar />
      <Hero />
      <FeaturesHighlights />
      <Preview />
      <About />
      <Features />
      <FAQSection />
      <LandingFooter />
    </div>
  )
}

export default Landing
