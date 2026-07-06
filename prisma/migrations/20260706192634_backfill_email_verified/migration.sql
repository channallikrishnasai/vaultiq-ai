-- Backfill existing users: mark them as verified so they can still sign in.
-- Users created before the email verification feature was added should not be locked out.
UPDATE "User" SET "emailVerified" = "createdAt" WHERE "emailVerified" IS NULL;
