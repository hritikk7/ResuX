import type { Metadata } from "next";
import LandingNav from "@/app/components/landing/LandingNav";
import Hero from "@/app/components/landing/Hero";
import BuiltWithBar from "@/app/components/landing/BuiltWithBar";
import HowItWorks from "@/app/components/landing/HowItWorks";
import Features from "@/app/components/landing/Features";
import LiveDemo from "@/app/components/landing/LiveDemo";
import Architecture from "@/app/components/landing/Architecture";
import CTASection from "@/app/components/landing/CTASection";
import Footer from "@/app/components/landing/Footer";

const description =
  "ResuX compares your resume against any job description and streams back a transparent match score, the exact skills you're missing, and AI-rewritten bullets — grounded in what you've actually done.";

export const metadata: Metadata = {
  title: "ResuX — Know exactly where your resume stands",
  description,
  openGraph: {
    title: "ResuX — AI-powered resume gap analysis",
    description,
    type: "website",
    siteName: "ResuX",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResuX — AI-powered resume gap analysis",
    description,
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30">
      <LandingNav />
      <main>
        <Hero />
        <BuiltWithBar />
        <HowItWorks />
        <Features />
        <LiveDemo />
        <Architecture />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
