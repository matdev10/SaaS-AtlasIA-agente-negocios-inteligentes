-- AlterTable
ALTER TABLE "widgets" ADD COLUMN "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];
