"use client";

import { HeroSection } from "./HeroSection";
import { StatsSection } from "./StatsSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { RecentItemsSection } from "./RecentItemsSection";
import { CategoriesSection } from "./CategoriesSection";
import { SafetyTipsSection } from "./SafetyTipsSection";
import { CallToActionSection } from "./CallToActionSection";

export function HomePage() {
  return (
    <div className="animate-fade-in">
      <HeroSection />
      <StatsSection />
      <CategoriesSection />
      <HowItWorksSection />
      <RecentItemsSection />
      <SafetyTipsSection />
      <CallToActionSection />
    </div>
  );
}
