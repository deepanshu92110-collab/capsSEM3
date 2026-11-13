CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN');
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "InternshipStatus" AS ENUM ('OFFERED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Application" (
  "id" TEXT NOT NULL, "studentProfileId" TEXT NOT NULL, "opportunityId" TEXT NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED', "coverLetter" TEXT,
  "recruiterRemarks" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ApplicationStatusHistory" (
  "id" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "status" "ApplicationStatus" NOT NULL,
  "remarks" TEXT, "changedByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Interview" (
  "id" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "scheduledAt" TIMESTAMP(3) NOT NULL,
  "location" TEXT, "meetingUrl" TEXT, "notes" TEXT, "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Internship" (
  "id" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "studentProfileId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL, "institutionId" TEXT, "title" TEXT NOT NULL, "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3), "status" "InternshipStatus" NOT NULL DEFAULT 'OFFERED', "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Placement" (
  "id" TEXT NOT NULL, "studentProfileId" TEXT NOT NULL, "institutionId" TEXT, "companyId" TEXT NOT NULL,
  "role" TEXT NOT NULL, "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "compensation" TEXT,
  "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "type" TEXT NOT NULL, "title" TEXT NOT NULL,
  "message" TEXT NOT NULL, "link" TEXT, "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Application_studentProfileId_opportunityId_key" ON "Application"("studentProfileId", "opportunityId");
CREATE INDEX "Application_opportunityId_status_idx" ON "Application"("opportunityId", "status");
CREATE INDEX "Application_studentProfileId_createdAt_idx" ON "Application"("studentProfileId", "createdAt");
CREATE INDEX "ApplicationStatusHistory_applicationId_createdAt_idx" ON "ApplicationStatusHistory"("applicationId", "createdAt");
CREATE INDEX "Interview_applicationId_scheduledAt_idx" ON "Interview"("applicationId", "scheduledAt");
CREATE UNIQUE INDEX "Internship_applicationId_key" ON "Internship"("applicationId");
CREATE INDEX "Internship_studentProfileId_status_idx" ON "Internship"("studentProfileId", "status");
CREATE INDEX "Internship_institutionId_status_idx" ON "Internship"("institutionId", "status");
CREATE INDEX "Placement_institutionId_placedAt_idx" ON "Placement"("institutionId", "placedAt");
CREATE INDEX "Placement_companyId_placedAt_idx" ON "Placement"("companyId", "placedAt");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
