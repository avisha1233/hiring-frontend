import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Send,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  BarChart2,
  Building2,
  User,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "For companies", href: "#features" },
  { label: "For candidates", href: "#features" },
  { label: "Contact", href: "#contact" },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Register and set up your profile",
    desc: "Candidates add their skills, experience, qualifications and location. Companies register and describe what they are looking for.",
  },
  {
    step: 2,
    title: "Companies post open jobs",
    desc: "Companies create detailed job listings with required skills, experience level, salary range, location and job type.",
  },
  {
    step: 3,
    title: "Candidates apply or receive proposals",
    desc: "Candidates browse and apply directly. Companies can also send job proposals to candidates who match the role requirements.",
  },
  {
    step: 4,
    title: "Tasks are assigned and reviewed",
    desc: "Companies assign practical tasks to shortlisted candidates. Candidates submit their work and receive scores and feedback.",
  },
  {
    step: 5,
    title: "Interviews are scheduled",
    desc: "Companies schedule online or on-site interviews. Candidates confirm or reschedule — all tracked in one place.",
  },
  {
    step: 6,
    title: "Hire the right person",
    desc: "The company reviews the full candidate journey — application, task score, interview — and makes the final hiring decision.",
  },
];

const FEATURES = [
  {
    icon: Briefcase,
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
    title: "Job postings",
    desc: "Companies post detailed job listings with skills, salary, location and experience. Candidates browse and apply with one click.",
  },
  {
    icon: Send,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    title: "Job proposals",
    desc: "Companies send job proposals directly to candidates. Candidates review and accept or decline from their dashboard.",
  },
  {
    icon: CalendarDays,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Interview scheduling",
    desc: "Schedule, confirm and reschedule interviews online or on-site. Both sides manage their calendar from one screen.",
  },
  {
    icon: ClipboardList,
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "Task assessments",
    desc: "Assign practical work tasks before interviews. Review submissions, give scores and send feedback all inside the platform.",
  },
  {
    icon: MessageSquare,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "Built-in messaging",
    desc: "Candidates and companies communicate directly through HireIQ. All conversations tied to the relevant job.",
  },
  {
    icon: BarChart2,
    bg: "bg-orange-100",
    iconColor: "text-orange-700",
    title: "Hiring analytics",
    desc: "Track the full hiring funnel from application to hire. See where candidates drop off and improve your process.",
  },
];

const FOOTER_LINKS = ["About", "Features", "Privacy", "Terms", "Contact"];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-orange-100 bg-white px-8">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
          
        </div>
        <span className="text-sm font-semibold text-gray-900">Smart Hiring </span>
      </div>

      {/* Nav links */}
      <div className="ml-7 hidden items-center gap-5 md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm text-gray-500 transition hover:text-orange-600"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Auth buttons */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/login")}
          className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
        >
          Sign in
        </Button>
        <Button
          size="sm"
          onClick={() => navigate("/register")}
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          Get started 
        </Button>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="border-b border-orange-100 bg-[radial-gradient(circle_at_top,_#fff7ed_0,_#fff_60%,_#fff_100%)] px-8 py-16 text-center">
      

      {/* Title */}
      <h1 className="mb-3 text-4xl font-semibold leading-tight text-gray-900">
        The smarter way to
        <br />
        hire and get{" "}
        <span className="text-orange-500">hired.</span>
      </h1>

      {/* Subtitle */}
      <p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-gray-500">
        Smart Hiring connects companies with the right candidates through skill-based
        profiles, structured hiring workflows, task assessments and seamless
        communication — all in one platform.
      </p>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => navigate("/register/company")}
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Post a job
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/register/candidate")}
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <User className="mr-2 h-4 w-4" />
          Find jobs
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/login")}
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Admin login
        </Button>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-8 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          How it works
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-500">
          A simple structured process from job posting to final hire — for both
          companies and candidates.
        </p>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HOW_IT_WORKS.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-orange-100 bg-orange-50 p-5"
          >
            {/* Step number circle */}
            <div className="mb-4 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
              {item.step}
            </div>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              {item.title}
            </h3>
            <p className="text-xs leading-relaxed text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="bg-orange-50 px-8 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Everything built in
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-500">
          All the tools companies and candidates need — in one connected
          platform.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-2xl border border-orange-100 bg-white p-5 transition hover:shadow-sm"
            >
              {/* Icon box */}
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${feature.bg}`}
              >
                <Icon className={`h-4 w-4 ${feature.iconColor}`} />
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500">
                {feature.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-orange-500 px-8 py-14 text-center">
      {/* Decorative top line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-600" />

      <h2 className="mb-3 text-2xl font-semibold text-white">
        Start hiring or get hired today
      </h2>
      <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-orange-100">
        Join hundreds of companies and thousands of candidates already building
        careers on Smart Hiring.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/register/company")}
          className="bg-white text-orange-600 hover:bg-orange-50"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Register your company
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/register/candidate")}
          className=" bg-white text-orange-600 hover:bg-orange-50"
        >
          <User className="mr-2 h-4 w-4" />
          Create candidate profile
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      id="contact"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-orange-100 bg-white px-8 py-5"
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white">
      
        </div>
        <span className="text-sm font-semibold text-gray-900">Smart Hiring</span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-5">
        {FOOTER_LINKS.map((link) => (
          <span
            key={link}
            className="cursor-pointer text-xs text-gray-400 transition hover:text-orange-600"
          >
            {link}
          </span>
        ))}
      </div>

      {/* Copyright */}
      <span className="text-xs text-gray-400">
        © {new Date().getFullYear()} Smart Hiring. All rights reserved.
      </span>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
