import React, { useState, useEffect, useRef } from 'react';
import { Sprout, Box, Truck, MapPin, CheckCircle, Play, Pause, Zap, ArrowRight, ShieldCheck, Compass } from 'lucide-react';

export default function FarmToTableSnakeProcess({ homeContent = {} }) {
  const sectionRef = useRef(null);
  const journeyContainerRef = useRef(null);
  const pathRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bikePos, setBikePos] = useState({ x: 250, y: 110, angle: 0 });

  // Track window scroll relative to the Journey Cards Container
  useEffect(() => {
    const handleScroll = () => {
      if (!journeyContainerRef.current) return;
      const rect = journeyContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Start at 0% when top of cards container enters middle of screen (45% line)
      const startLine = windowHeight * 0.45;
      const totalDist = Math.max(rect.height - windowHeight * 0.3, 1);
      
      const currentDist = startLine - rect.top;
      const pct = Math.min(Math.max(currentDist / totalDist, 0), 1);
      setScrollProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute exact (X, Y) and steering angle along SVG path
  useEffect(() => {
    if (!pathRef.current) return;
    try {
      const totalLen = pathRef.current.getTotalLength();
      const currentLen = scrollProgress * totalLen;
      const pt = pathRef.current.getPointAtLength(currentLen);
      
      // Calculate angle by sampling a point slightly ahead
      const nextLen = Math.min(currentLen + 3, totalLen);
      const nextPt = pathRef.current.getPointAtLength(nextLen);
      
      const dx = nextPt.x - pt.x;
      const dy = nextPt.y - pt.y;
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
      
      setBikePos({ x: pt.x, y: pt.y, angle: angleDeg });
    } catch (err) {
      console.warn('SVG path math calculation fallback:', err);
    }
  }, [scrollProgress]);

  // Determine current active step
  let currentStep = 1;
  if (scrollProgress > 0.75) {
    currentStep = 4;
  } else if (scrollProgress > 0.45) {
    currentStep = 3;
  } else if (scrollProgress > 0.15) {
    currentStep = 2;
  }

  const handleStepClick = (stepNum) => {
    const targetProgress = stepNum === 1 ? 0.01 : stepNum === 2 ? 0.33 : stepNum === 3 ? 0.66 : 0.98;
    setScrollProgress(targetProgress);
  };

  const steps = [
    {
      stepNum: 1,
      title: homeContent.process1Title || "1. Fresh Harvest",
      subtitle: "Soil-Picked Organic Produce",
      desc: homeContent.process1Desc || "Farmers pick organic produce only after you place your order to ensure peak flavor, maximum nutrition, and zero shelf decay.",
      icon: Sprout,
      side: "left",
      badge: "START: FARM HARVEST",
      color: "from-emerald-500 to-teal-600",
      accentBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      detailsList: ["Organic Non-GMO Soil", "Harvested Post-Order", "Farmer QR Traced"]
    },
    {
      stepNum: 2,
      title: homeContent.process2Title || "2. Eco Packaging",
      subtitle: "100% Biodegradable Eco-Pack",
      desc: homeContent.process2Desc || "Items are sorted and wrapped in plastic-free biodegradable packets to protect freshness and preserve the environment.",
      icon: Box,
      side: "right",
      badge: "HUB: ECO PACKAGING",
      color: "from-teal-500 to-emerald-600",
      accentBg: "bg-teal-50 text-teal-800 border-teal-200",
      detailsList: ["Corn-Starch Bio Wraps", "Temperature Insulated", "Zero Chemical Preservatives"]
    },
    {
      stepNum: 3,
      title: homeContent.process3Title || "3. Swift Transit",
      subtitle: "Live GPS Express Route",
      desc: homeContent.process3Desc || "Delivery partners collect your box immediately and run optimized routes using live map tracking for sub-4 hour arrival.",
      icon: Truck,
      side: "left",
      badge: "WAYPOINT: EXPRESS TRANSIT",
      color: "from-emerald-600 to-teal-700",
      accentBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      detailsList: ["Direct Express Route", "Insulated Cold Bag", "Live Map Rider Tracking"]
    },
    {
      stepNum: 4,
      title: homeContent.process4Title || "4. Doorstep Joy",
      subtitle: "Contactless Home Drop-Off",
      desc: homeContent.process4Desc || "Get contact-free drop off in under 4 hours, and scan farm codes for complete origin tracing right at your doorstep.",
      icon: MapPin,
      side: "right",
      badge: "FINAL DESTINATION",
      color: "from-teal-600 to-emerald-800",
      accentBg: "bg-teal-50 text-teal-800 border-teal-200",
      detailsList: ["Contactless Delivery", "100% Freshness Guarantee", "Farm Code Verification"]
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-slate-50/60 via-emerald-50/30 to-white relative overflow-hidden text-left border-y border-slate-100">
      {/* Ambient Background Glows */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider font-mono">
            <Zap size={14} className="text-emerald-600 fill-emerald-600" /> LIVE ROAD TRAVEL JOURNEY
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-headings text-slate-900 tracking-tight">
            {homeContent.processTitle || "Our Farm-to-Table Process"}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium font-body leading-relaxed">
            Watch our delivery bike travel continuously along the highway road from <strong>Fresh Harvest</strong> ➔ <strong>Eco Packaging</strong> ➔ <strong>Swift Transit</strong> ➔ <strong>Doorstep Joy</strong>.
          </p>

          {/* Controls Bar & Progress Metric */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {steps.map((s) => (
              <button
                key={s.stepNum}
                type="button"
                onClick={() => handleStepClick(s.stepNum)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer font-headings ${
                  currentStep === s.stepNum
                    ? 'bg-slate-900 text-emerald-400 border border-emerald-500/40 shadow-sm scale-105'
                    : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                0{s.stepNum}. {s.title.replace(/^\d+\.\s*/, '')}
              </button>
            ))}
          </div>

          {/* Clean Journey Status Ribbon */}
          <div className="mt-4 bg-slate-900 text-white px-5 py-2.5 rounded-2xl max-w-xl mx-auto flex items-center justify-between shadow-xl border border-slate-800 text-xs font-headings">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Journey Progress: <strong className="text-emerald-400">{Math.round(scrollProgress * 100)}%</strong></span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Stage 0{currentStep} / 04
            </span>
          </div>
        </div>

        {/* Highway Journey Container */}
        <div ref={journeyContainerRef} className="relative min-h-[950px] lg:min-h-[920px] py-4">

          {/* Precise Highway SVG Road & Guideline (Desktop & Tablet) */}
          <div className="absolute inset-0 pointer-events-none hidden md:block z-0">
            <svg className="w-full h-full" viewBox="0 0 1000 900" preserveAspectRatio="none" fill="none">
              {/* Soft Ambient Glow Under Path */}
              <path
                d="M 250 110 C 650 110, 750 180, 750 340 C 750 500, 350 580, 250 580 C 150 580, 350 810, 750 810"
                stroke="#10b981"
                strokeWidth="12"
                strokeOpacity="0.18"
                strokeLinecap="round"
              />

              {/* Normal Clean Emerald Path Guideline (Referenced by JS) */}
              <path
                ref={pathRef}
                d="M 250 110 C 650 110, 750 180, 750 340 C 750 500, 350 580, 250 580 C 150 580, 350 810, 750 810"
                stroke="#059669"
                strokeWidth="4"
                strokeDasharray="8 8"
                strokeLinecap="round"
                className="animate-pulse"
              />

              {/* Checkpoint Nodes Rings */}
              <g>
                <circle cx="250" cy="110" r="16" fill="#059669" stroke="#ffffff" strokeWidth="4" />
                <text x="250" y="114" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">01</text>
              </g>
              <g>
                <circle cx="750" cy="340" r="16" fill="#059669" stroke="#ffffff" strokeWidth="4" />
                <text x="750" y="344" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">02</text>
              </g>
              <g>
                <circle cx="250" cy="580" r="16" fill="#059669" stroke="#ffffff" strokeWidth="4" />
                <text x="250" y="584" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">03</text>
              </g>
              <g>
                <circle cx="750" cy="810" r="16" fill="#059669" stroke="#ffffff" strokeWidth="4" />
                <text x="750" y="814" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">04</text>
              </g>
            </svg>
          </div>

          {/* Smooth Travelling Delivery Boy Character (Upright & Directionally Flipped) */}
          {(() => {
            const isMovingLeft = Math.abs(bikePos.angle) > 90;
            const displayAngle = isMovingLeft ? bikePos.angle - 180 : bikePos.angle;
            const flipTransform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';

            return (
              <div
                className="absolute transition-transform duration-75 ease-out z-30 pointer-events-none hidden md:flex items-center justify-center"
                style={{
                  left: `${(bikePos.x / 1000) * 100}%`,
                  top: `${(bikePos.y / 900) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${displayAngle}deg)`
                }}
              >
                <div className="w-16 h-16 rounded-full bg-white/95 backdrop-blur-md p-1.5 shadow-2xl shadow-emerald-950/40 border-2 border-emerald-500 flex items-center justify-center relative">
                  <img
                    src="/delivery_boy_rider.png"
                    alt="Delivery Boy Rider"
                    className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200"
                    style={{ transform: flipTransform }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Mobile Vertical Road Line */}
          <div className="absolute top-0 bottom-0 left-6 sm:left-1/2 w-1.5 bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-700 rounded-full md:hidden z-0" />

          {/* Steps Cards Grid */}
          <div className="space-y-16 lg:space-y-24 relative z-10">
            {steps.map((step) => {
              const isPassed = currentStep >= step.stepNum;
              const isCurrent = currentStep === step.stepNum;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.stepNum}
                  className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
                >
                  {/* Step Card Column */}
                  <div
                    className={`md:col-span-6 ${
                      step.side === 'left'
                        ? 'md:col-start-1'
                        : 'md:col-start-7'
                    }`}
                  >
                    <div
                      onClick={() => handleStepClick(step.stepNum)}
                      className={`relative bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border transition-all duration-500 shadow-lg hover:shadow-2xl cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-950/15 bg-white scale-[1.03] -translate-y-1'
                          : isPassed
                          ? 'border-emerald-200/90 bg-white/95'
                          : 'border-slate-200/70 opacity-85 hover:opacity-100'
                      }`}
                    >
                      {/* Step Header Badge & Counter */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl border font-mono ${step.accentBg}`}>
                          {step.badge}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isPassed ? (
                            <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 font-headings shadow-2xs">
                              <CheckCircle size={11} /> Waypoint Reached
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full font-mono">
                              Step 0{step.stepNum}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Icon & Title Block */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/20`}>
                          <StepIcon size={26} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black font-headings text-slate-900 leading-tight">
                            {step.title}
                          </h3>
                          <p className="text-[11px] font-extrabold text-emerald-700 font-headings uppercase tracking-wider">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 font-medium font-body leading-relaxed mb-4">
                        {step.desc}
                      </p>

                      {/* Feature Bullet Chips */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {step.detailsList.map((item, idx) => (
                          <span key={idx} className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200/60 font-body flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {item}
                          </span>
                        ))}
                      </div>

                      {/* Card Footer Status Bar */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-400 uppercase font-headings">
                          Stage Status
                        </span>
                        <span className={`font-black font-mono flex items-center gap-1 ${isPassed ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {isPassed ? '100% Completed' : 'En Route...'} <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
