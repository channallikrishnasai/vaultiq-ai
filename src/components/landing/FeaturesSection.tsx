// src/components/landing/FeaturesSection.tsx

import { features } from "@/lib/landing-data";
import FeatureCard from "./FeatureCard";

export default function FeaturesSection() {
  return (
    <section id="features" className="relative bg-zinc-950 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="mb-14 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
            Features
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Everything Finance, Unified
          </h2>
          <p className="mx-auto max-w-xl text-zinc-400">
            Six powerful modules that cover every aspect of your financial life —
            all in one intelligent platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
}