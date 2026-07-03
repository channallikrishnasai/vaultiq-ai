"use client";

// Multi-stage thinking animation controller
// Stages: idle → jitter → converge → swallow → flash → reveal → idle

export type ThinkingStage = "idle" | "jitter" | "converge" | "swallow" | "flash" | "reveal";

export interface StageConfig {
  /** Duration of this stage in ms */
  duration: number;
  /** Cards move randomly */
  cardsJitter: boolean;
  /** Cards move toward center */
  cardsConverge: boolean;
  /** Cards hidden (swallowed) */
  cardsHidden: boolean;
  /** Planet scale multiplier */
  planetScale: number;
  /** Planet rotation speed multiplier */
  planetSpeed: number;
  /** Flash opacity */
  flashOpacity: number;
  /** Show response */
  showResponse: boolean;
}

export const STAGE_CONFIG: Record<ThinkingStage, StageConfig> = {
  idle: {
    duration: 0,
    cardsJitter: false,
    cardsConverge: false,
    cardsHidden: false,
    planetScale: 1,
    planetSpeed: 1,
    flashOpacity: 0,
    showResponse: false,
  },
  jitter: {
    duration: 1200,
    cardsJitter: true,
    cardsConverge: false,
    cardsHidden: false,
    planetScale: 1.1,
    planetSpeed: 3,
    flashOpacity: 0,
    showResponse: false,
  },
  converge: {
    duration: 1500,
    cardsJitter: true,
    cardsConverge: true,
    cardsHidden: false,
    planetScale: 1.8,
    planetSpeed: 6,
    flashOpacity: 0,
    showResponse: false,
  },
  swallow: {
    duration: 800,
    cardsJitter: false,
    cardsConverge: true,
    cardsHidden: true,
    planetScale: 2.5,
    planetSpeed: 10,
    flashOpacity: 0,
    showResponse: false,
  },
  flash: {
    duration: 600,
    cardsJitter: false,
    cardsConverge: false,
    cardsHidden: true,
    planetScale: 1.2,
    planetSpeed: 2,
    flashOpacity: 1,
    showResponse: false,
  },
  reveal: {
    duration: 1000,
    cardsJitter: false,
    cardsConverge: false,
    cardsHidden: false,
    planetScale: 1,
    planetSpeed: 1,
    flashOpacity: 0,
    showResponse: true,
  },
};

export const STAGE_ORDER: ThinkingStage[] = ["idle", "jitter", "converge", "swallow", "flash", "reveal"];
