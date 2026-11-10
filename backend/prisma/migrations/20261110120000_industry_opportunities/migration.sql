-- Add Industry & Opportunities schema.
-- This migration is intentionally not applied to any database here.

CREATE TYPE "OpportunityType" AS ENUM ('INTERNSHIP', 'JOB', 'PROJECT');
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "description" TEXT NOT NULL,
    "responsibilities" TEXT,
    "qualifications" TEXT,
    "location" TEXT,
    "workMode" "WorkMode",
    "compensation" TEXT,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "applicationUrl" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Opportunity_companyId_status_idx" ON "Opportunity"("companyId", "status");
CREATE INDEX "Opportunity_type_status_idx" ON "Opportunity"("type", "status");
CREATE INDEX "Opportunity_applicationDeadline_idx" ON "Opportunity"("applicationDeadline");
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
