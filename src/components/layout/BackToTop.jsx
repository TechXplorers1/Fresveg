import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setScrollProgress(progress);
      setIsVisible(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-75 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to Top"
        title="Scroll to Top"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-xl shadow-emerald-950/20 border border-slate-200/80 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-90 transition-all duration-300 cursor-pointer"
      >
        {/* SVG Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 44 44"
        >
          {/* Track */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2.5"
          />
          {/* Progress */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="url(#scrollGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100"
          />
          <defs>
            <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
        </svg>

        {/* Arrow Icon */}
        <ChevronUp
          size={18}
          strokeWidth={2.5}
          className="relative z-10 text-emerald-600 group-hover:-translate-y-0.5 transition-transform duration-300"
        />

        {/* Tooltip */}
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md font-headings">
          Back to Top
        </span>
      </button>
    </div>
  );
}

