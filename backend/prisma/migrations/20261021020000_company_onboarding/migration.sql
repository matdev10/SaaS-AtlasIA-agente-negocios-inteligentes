-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM (
  'WELCOME',
  'COMPANY_PROFILE',
  'AGENT_CONFIG',
  'KNOWLEDGE',
  'TEST_CHAT',
  'PUBLISH',
  'COMPLETED'
);

-- AlterTable
ALTER TABLE "companies"
  ADD COLUMN "language" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "businessHours" TEXT,
  ADD COLUMN "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'WELCOME',
  ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "companies_onboardingStep_idx" ON "companies"("onboardingStep");
