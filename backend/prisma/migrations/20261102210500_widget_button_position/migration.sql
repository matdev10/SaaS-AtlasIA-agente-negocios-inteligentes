-- AlterTable
ALTER TABLE "widgets" ADD COLUMN "buttonPosition" TEXT DEFAULT 'bottom-right';

UPDATE "widgets"
SET "buttonPosition" = CASE
  WHEN "position" IN ('bottom-left', 'bottom-center', 'bottom-right') THEN "position"
  ELSE 'bottom-right'
END
WHERE "buttonPosition" IS NULL;
