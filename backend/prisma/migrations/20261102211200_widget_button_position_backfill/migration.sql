-- The previous migration's default filled existing rows before the backfill.
UPDATE "widgets"
SET "buttonPosition" = "position"
WHERE "position" IN ('bottom-left', 'bottom-center', 'bottom-right');
