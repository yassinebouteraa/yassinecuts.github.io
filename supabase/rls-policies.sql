-- Row Level Security for the portfolio tables.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> Run.
--
-- Before running, create your admin user:
--   Authentication -> Users -> Add user -> (email + password, "Auto Confirm" on)
-- That email/password is what you type into the site's admin sign-in form.
--
-- The shape below: anyone may READ videos and testimonials, anyone may SUBMIT
-- a testimonial (the public "Leave a Review" form) and a contact message, but
-- only a signed-in user may edit or delete anything.

-- ---------------------------------------------------------------- videos ---
alter table public.videos enable row level security;

drop policy if exists "videos are publicly readable" on public.videos;
create policy "videos are publicly readable"
  on public.videos for select
  to anon, authenticated
  using (true);

drop policy if exists "only signed-in users can add videos" on public.videos;
create policy "only signed-in users can add videos"
  on public.videos for insert
  to authenticated
  with check (true);

drop policy if exists "only signed-in users can edit videos" on public.videos;
create policy "only signed-in users can edit videos"
  on public.videos for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "only signed-in users can delete videos" on public.videos;
create policy "only signed-in users can delete videos"
  on public.videos for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------- testimonials ---
alter table public.testimonials enable row level security;

drop policy if exists "testimonials are publicly readable" on public.testimonials;
create policy "testimonials are publicly readable"
  on public.testimonials for select
  to anon, authenticated
  using (true);

-- Visitors may leave a written review, but may not upload screenshots.
drop policy if exists "anyone can leave a text review" on public.testimonials;
create policy "anyone can leave a text review"
  on public.testimonials for insert
  to anon
  with check (type = 'text');

drop policy if exists "signed-in users can add any testimonial" on public.testimonials;
create policy "signed-in users can add any testimonial"
  on public.testimonials for insert
  to authenticated
  with check (true);

drop policy if exists "only signed-in users can delete testimonials" on public.testimonials;
create policy "only signed-in users can delete testimonials"
  on public.testimonials for delete
  to authenticated
  using (true);

-- -------------------------------------------------------------- messages ---
-- Contact-form submissions: write-only for the public, readable only by you.
alter table public.messages enable row level security;

drop policy if exists "anyone can send a message" on public.messages;
create policy "anyone can send a message"
  on public.messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "only signed-in users can read messages" on public.messages;
create policy "only signed-in users can read messages"
  on public.messages for select
  to authenticated
  using (true);
