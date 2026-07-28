import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const windowScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      
      // Also check if any container has scrolled down
      let containerScroll = 0;
      const scrollableElements = document.querySelectorAll('.custom-scrollbar, [data-scrollable="true"], main, div');
      scrollableElements.forEach(el => {
        if (el.scrollTop > containerScroll) {
          containerScroll = el.scrollTop;
        }
      });

      if (windowScroll > 250 || containerScroll > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, true);
    return () => window.removeEventListener('scroll', toggleVisibility, true);
  }, []);

  const scrollToTop = () => {
    // 1. Smooth scroll the main window & document body
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (document.body) {
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 2. Smooth scroll any inner scrollable containers in vendor dashboard / pages
    const scrollableElements = document.querySelectorAll('.custom-scrollbar, [data-scrollable="true"], main, div');
    scrollableElements.forEach(el => {
      if (el.scrollTop > 0) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        className="group relative flex items-center justify-center gap-2 p-3 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full sm:rounded-2xl shadow-xl shadow-emerald-950/25 border border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-600/40 active:scale-95 transition-all duration-300 cursor-pointer"
        aria-label="Back to Top"
        title="Back to Top"
      >
        <ChevronUp size={20} strokeWidth={2.5} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
        <span className="hidden sm:inline-block text-xs font-black tracking-wide font-headings pr-0.5">
          Top
        </span>

        {/* Glowing aura background on hover */}
        <span className="absolute -inset-0.5 rounded-full sm:rounded-2xl bg-emerald-400/30 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 -z-10" />
      </button>
    </div>
  );
}
