CREATE TYPE "CompanyVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

ALTER TABLE "Company"
ADD COLUMN "verificationStatus" "CompanyVerificationStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "Company"
SET "verificationStatus" = CASE WHEN "isVerified" THEN 'VERIFIED'::"CompanyVerificationStatus" ELSE 'PENDING'::"CompanyVerificationStatus" END;
