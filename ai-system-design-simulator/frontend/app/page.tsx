"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Sparkles, MessageSquare, Activity, ChevronRight } from "lucide-react";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 12 }
    },
  };

  return (
    <div className="relative min-h-screen text-slate-100 bg-transparent">
      {/* Remove old background classes since Background3D handles it */}
      
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-20">
        <motion.header 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center gap-8 pt-10"
        >
          <motion.div variants={itemVariants} className="w-fit rounded-full border border-[#ff6b4a]/30 bg-[#ff6b4a]/10 px-5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#ff6b4a] shadow-[0_0_15px_rgba(255,107,74,0.3)] backdrop-blur-md">
            Next-Gen Interview Simulator
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="font-display text-5xl leading-tight sm:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Ace your system design<br />interviews.
          </motion.h1>
          
          <motion.p variants={itemVariants} className="max-w-2xl text-lg text-slate-300 font-light">
            Practice with an AI interviewer, get instant feedback, and track your
            progress. Clean prompts, real follow-ups, and a workflow that feels
            like the real thing.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-6 mt-4">
            <Link
              className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-8 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(255,107,74,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,107,74,0.6)]"
              href="/dashboard"
            >
              <Sparkles className="w-4 h-4" />
              Start Practice Session
            </Link>
            <Link
              className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
              href="/login"
            >
              Login
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.header>

        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-3 mt-10"
        >
          {[
            {
              title: "AI-led interview flow",
              text: "Step-by-step questions that feel like a real onsite loop.",
              icon: <MessageSquare className="w-6 h-6 text-[#3b5bff]" />,
              glow: "shadow-[0_0_30px_rgba(59,91,255,0.2)]"
            },
            {
              title: "Instant feedback",
              text: "Quick guidance on scalability, data modeling, and caching.",
              icon: <Activity className="w-6 h-6 text-[#ff6b4a]" />,
              glow: "shadow-[0_0_30px_rgba(255,107,74,0.2)]"
            },
            {
              title: "Results snapshot",
              text: "Track strengths, weak spots, and focus areas per session.",
              icon: <Sparkles className="w-6 h-6 text-[#3b5bff]" />,
              glow: "shadow-[0_0_30px_rgba(59,91,255,0.2)]"
            },
          ].map((item, i) => (
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 ${item.glow} transition-all duration-300 hover:border-white/20 hover:bg-white/10`}
              key={item.title}
            >
              <div className="mb-4 inline-flex p-3 rounded-2xl bg-white/5 border border-white/10">
                {item.icon}
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          className="grid gap-6 md:grid-cols-[1.2fr_1fr] pb-20"
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h3 className="font-display text-3xl font-bold text-white">
              Turn prep into confident system design answers.
            </h3>
            <p className="mt-4 text-slate-300 text-lg leading-relaxed">
              Use targeted prompts, structured follow-ups, and feedback that
              tells you exactly what to improve.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium text-slate-200">
              <span className="rounded-full border border-[#3b5bff]/30 bg-[#3b5bff]/10 px-5 py-2.5">
                5 core prompts
              </span>
              <span className="rounded-full border border-[#ff6b4a]/30 bg-[#ff6b4a]/10 px-5 py-2.5">
                Live chat feedback
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5">
                Session history
              </span>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101826]/80 via-[#0f172a]/80 to-[#141a2d]/80 p-10 shadow-[0_0_60px_rgba(255,107,74,0.3)] backdrop-blur-xl flex flex-col justify-center">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-[#ff6b4a]/20 rounded-full blur-3xl pointer-events-none" />
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ff6b4a]">
              Sample results
            </p>
            <h3 className="mt-4 font-display text-3xl font-bold text-white">
              Score clarity, not fluff.
            </h3>
            <p className="mt-4 text-slate-300 leading-relaxed">
              See what you nailed and exactly where to tighten your design.
            </p>
            <Link
              className="mt-8 w-fit inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 hover:scale-105"
              href="/results"
            >
              View sample results
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
