/*
  Warnings:

  - You are about to drop the column `healthScore` on the `FinancialTwin` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "AiProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "occupation" TEXT,
    "riskAppetite" TEXT NOT NULL DEFAULT 'MODERATE',
    "monthlyIncome" REAL,
    "monthlyExpenses" REAL,
    "financialGoals" JSONB,
    "riskTolerance" TEXT,
    "personaSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinancialTwin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Financial Twin',
    "riskAppetite" TEXT NOT NULL DEFAULT 'MODERATE',
    "snapshot" JSONB NOT NULL,
    "projections" JSONB,
    "recommendations" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialTwin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FinancialTwin" ("createdAt", "id", "isActive", "name", "projections", "recommendations", "riskAppetite", "snapshot", "updatedAt", "userId") SELECT "createdAt", "id", "isActive", "name", "projections", "recommendations", "riskAppetite", "snapshot", "updatedAt", "userId" FROM "FinancialTwin";
DROP TABLE "FinancialTwin";
ALTER TABLE "new_FinancialTwin" RENAME TO "FinancialTwin";
CREATE INDEX "FinancialTwin_userId_idx" ON "FinancialTwin"("userId");
CREATE INDEX "FinancialTwin_userId_isActive_idx" ON "FinancialTwin"("userId", "isActive");
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "income" REAL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "riskAppetite" TEXT NOT NULL DEFAULT 'MODERATE',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATETIME,
    "badges" JSONB,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "occupation" TEXT,
    "monthlyExpenses" REAL,
    "emergencyFundTarget" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("age", "badges", "createdAt", "currency", "id", "income", "lastActiveDate", "riskAppetite", "streak", "updatedAt", "userId", "xp") SELECT "age", "badges", "createdAt", "currency", "id", "income", "lastActiveDate", "riskAppetite", "streak", "updatedAt", "userId", "xp" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AiProfile_userId_key" ON "AiProfile"("userId");
