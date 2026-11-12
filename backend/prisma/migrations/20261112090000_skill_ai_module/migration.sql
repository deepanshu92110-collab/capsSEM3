CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE "SkillSource" AS ENUM ('MANUAL', 'ASSESSMENT', 'RESUME');

CREATE TABLE "Skill" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");
CREATE INDEX "Skill_category_name_idx" ON "Skill"("category", "name");

CREATE TABLE "StudentSkill" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "proficiencyLevel" "ProficiencyLevel" NOT NULL,
  "source" "SkillSource" NOT NULL DEFAULT 'MANUAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentSkill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StudentSkill_studentProfileId_skillId_key" ON "StudentSkill"("studentProfileId", "skillId");
CREATE INDEX "StudentSkill_skillId_proficiencyLevel_idx" ON "StudentSkill"("skillId", "proficiencyLevel");
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Assessment" (
  "id" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "totalQuestions" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Assessment_skillId_idx" ON "Assessment"("skillId");
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AssessmentQuestion" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "options" TEXT[] NOT NULL,
  "correctAnswer" INTEGER NOT NULL,
  "explanation" TEXT,
  CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AssessmentResult" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "percentage" DOUBLE PRECISION NOT NULL,
  "proficiencyLevel" "ProficiencyLevel" NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssessmentResult_studentProfileId_completedAt_idx" ON "AssessmentResult"("studentProfileId", "completedAt");
CREATE INDEX "AssessmentResult_assessmentId_completedAt_idx" ON "AssessmentResult"("assessmentId", "completedAt");
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LearningRecommendation" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "difficulty" "ProficiencyLevel" NOT NULL DEFAULT 'BEGINNER',
  "resourceUrl" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 3,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningRecommendation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LearningRecommendation_studentProfileId_isCompleted_priority_idx" ON "LearningRecommendation"("studentProfileId", "isCompleted", "priority");
ALTER TABLE "LearningRecommendation" ADD CONSTRAINT "LearningRecommendation_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningRecommendation" ADD CONSTRAINT "LearningRecommendation_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
