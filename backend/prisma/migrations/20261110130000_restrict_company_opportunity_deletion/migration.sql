-- Protect opportunities from being removed through Company or User cascades.
-- A Company deletion is now rejected while opportunity rows reference it.
ALTER TABLE "Opportunity"
DROP CONSTRAINT "Opportunity_companyId_fkey",
ADD CONSTRAINT "Opportunity_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
