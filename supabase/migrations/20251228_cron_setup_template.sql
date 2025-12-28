-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Create a cron job to run the update-exchange-rates function every 6 hours
select cron.schedule(
  'update-exchange-rates', -- job name
  '0 */6 * * *',           -- schedule (every 6 hours)
  $$
  select
    net.http_post(
      url:='https://project-ref.supabase.co/functions/v1/update-exchange-rates',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
  $$
);

-- NOTE: In production, URL and Key need to be replaced with actual values.
-- Since we cannot easily automate this via migration file without knowing the Project Ref and Key,
-- this part usually needs to be set up manually in the Dashboard or via a specialized script.
-- Instead, we will rely on Vercel Cron or just calling it from the daily scraping job.

-- ALTERNATIVE: Trigger from existing daily scraping (simpler for now)
-- We'll integrate the call into our scraping API route.
