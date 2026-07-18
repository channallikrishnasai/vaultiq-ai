import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/lib/finance-utils.ts",
    "src/lib/financial-health.ts",
    "src/lib/twin-utils.ts",
    "src/services/market/**/*.ts",
  ],
};

export default config;
