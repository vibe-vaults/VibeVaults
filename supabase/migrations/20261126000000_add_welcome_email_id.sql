-- Resend id of the scheduled founder email ("Quick question about VibeVaults").
-- sendWelcomeNotification() schedules it 15 minutes ahead; if the account is
-- deleted inside that window, /api/auth/delete-account cancels it by this id
-- so a user who just left is not thanked for trying the product.
-- Additive and nullable: old builds never read or write it.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS welcome_email_id text;
