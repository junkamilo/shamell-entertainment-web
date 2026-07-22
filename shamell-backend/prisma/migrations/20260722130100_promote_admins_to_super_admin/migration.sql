-- Existing staff keep invite capability after SUPER_ADMIN was added
UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';
