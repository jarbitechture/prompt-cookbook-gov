import { useState } from "react";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663269100577/iNoee2hzjbmnACpdRetr7a/robot-chef-hero-CDn5BTigHTzYxm8RQw7AGt.webp";

interface HeroSectionProps {
  greeting?: string;
}

export default function HeroSection({ greeting }: HeroSectionProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      className="relative rounded-xl overflow-hidden mb-8"
      style={{ background: "oklch(0.14 0.025 38)" }}
    >
      {/* Hero image */}
      <div className="relative h-48 sm:h-60 md:h-68">
        {!imgError ? (
          <img
            src={HERO_IMAGE}
            alt="AI Robot Chef in a warm kitchen, reading a cookbook"
            className="w-full h-full object-cover object-top"
            style={{ filter: "saturate(0.9)" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(150deg, oklch(0.24 0.05 50) 0%, oklch(0.15 0.03 35) 60%, oklch(0.18 0.04 55) 100%)",
            }}
          />
        )}
        {/* Gradient: transparent top, dark at bottom so text is readable */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, transparent 20%, oklch(0.14 0.025 38 / 0.65) 65%, oklch(0.14 0.025 38) 100%)",
          }}
        />
      </div>

      {/* Text overlapping the image bottom */}
      <div className="relative px-5 sm:px-7 pb-5 sm:pb-6 -mt-24 z-10">
        <h1
          className="font-serif text-2xl sm:text-3xl font-bold mb-2 leading-tight"
          style={{ color: "oklch(0.96 0.015 78)" }}
        >
          AI Prompt Cookbook
        </h1>

        {greeting ? (
          <p
            className="text-sm max-w-md leading-relaxed"
            style={{ color: "oklch(0.76 0.08 58)" }}
          >
            {greeting}
          </p>
        ) : (
          <p
            className="text-sm max-w-md leading-relaxed"
            style={{ color: "oklch(0.70 0.03 68)" }}
          >
            Practical prompt recipes for Manatee County staff.
          </p>
        )}

        {/* Stats strip */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3"
          style={{ borderTop: "1px solid oklch(0.30 0.03 45 / 0.5)" }}
        >
          {[
            { value: "30", label: "recipes" },
            { value: "15", label: "templates" },
            { value: "7", label: "departments" },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <span className="text-lg font-black font-serif" style={{ color: "oklch(0.85 0.14 58)" }}>
                {value}
              </span>
              <span className="text-xs font-medium" style={{ color: "oklch(0.65 0.04 60)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
