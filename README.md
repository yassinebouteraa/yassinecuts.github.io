# yassinecuts.live

Portfolio site for Yassine Bouteraa — video editor and motion designer.
React + Vite, with Framer Motion driving the animation, Supabase for the video
and testimonial data, and Cloudinary for uploads.

## Running it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the built site
```

## Deploying

Pushing to `main` builds the site and publishes it through
`.github/workflows/deploy.yml`.

**One-time setup:** in the repo, go to **Settings → Pages → Build and
deployment → Source** and choose **GitHub Actions**. Until you do that, Pages
keeps serving the old files and nothing changes on the live site.

`public/CNAME` keeps the custom domain pointed at `yassinecuts.live`, and
`public/.nojekyll` stops GitHub from running Jekyll over the build.

## Admin mode

Click the **YassineCuts** logo in the header to open the admin sign-in form.
Signing in reveals the Add Video / Add Screenshot buttons and the per-item edit
and delete controls.

Set it up once:

1. In Supabase: **Authentication → Users → Add user**, with "Auto Confirm"
   enabled. That email and password are your admin credentials.
2. Run `supabase/rls-policies.sql` in the Supabase SQL editor. This is the part
   that actually protects the data — it lets anyone read the portfolio and leave
   a written review, but restricts edits and deletes to a signed-in user.

## Layout

```
src/
  config.js              public keys and shared option lists
  lib/                   supabase client, Cloudinary widget, video URL parsing
  context/               admin session, portfolio data, which modal is open
  hooks/                 active nav section, media queries
  components/
    motion/              the animation toolkit (see below)
    modals/              video, screenshot, review, hire, admin login
```

### The animation layer

Everything visual routes through a small set of primitives in
`src/components/motion/`, so the whole site shares one easing curve and one
sense of timing:

- **`Reveal` / `Stagger`** — scroll-triggered entrances, replacing the old
  IntersectionObserver-plus-CSS-class approach.
- **`TextReveal`** — headings whose words are clipped by their own line box and
  slide up, so text is uncovered rather than faded in.
- **`TiltCard`** — cursor-tracking 3D tilt on video and testimonial cards.
- **`MagneticButton`** — buttons that lean toward the cursor and spring back.
- **`CountUp`** — hero stats counting up the first time they come into view.
- **`ScrollProgress`** / **`CursorGlow`** — page-level ambience.

The hero adds scroll-linked parallax: the wordmark drifts fastest, the photo
slower, the copy slowest, which reads as depth rather than as an effect.

`prefers-reduced-motion` is honoured throughout — every primitive drops to a
static render, and parallax and the cursor glow switch off entirely.
