# Research: HardWorx Gym homepage redesign

Recon done 2026-10-17 in Chrome, plus raw HTML pulled from each nav page. Client screenshots are in `recon/` (1440 px and 390 px).

## The client

**What they deliver:** a 24/7 strength gym at 50662 Van Dyke Avenue, Shelby Township, MI.
- The floor is mostly red-and-black plate-loaded and pin-stack machines: Arsenal, Atlantis, PowerLift, Hammer Strength, Cybex, Panatta, Muscle D and True Fitness.
- There's a large free-weight area and cardio machines.
- Infrared saunas, two tanning salons and a cold plunge are "All Included in the Membership Price!"
- The HardWorx App gives members custom workouts and weight/rep logging "to keep track of progress", plus an exercise video library.
- Membership is capped at 500 members "to ensure there are no crowds".
- Pricing: $79/month recurring, $850 for a 12-month PIF, $150 for a 1-month PIF, and a free day pass.

**Who buys:** local lifters in Shelby Township and Macomb County.
- **Serious trainees.** The reviews say "built for people who want to train" and "beyond a casual gym membership".
- **Busy people.** Their copy says "Time is Money", "no longer waiting for equipment".
- **Beginners who don't know what to do.** The training page names this as "one of the biggest concerns", and the app answers it.
- **Families.** One section is headed "Family-Friendly Environment".

**What buyers care about, ranked from their own copy and reviews:**
1. **No waiting / no crowds:** the 500-member cap and "Time is Money".
2. **Equipment depth:** brand names, "Tons of machines", "Lots of plates".
3. **Clean, well kept:** cleanliness comes up in all three reviews and the mission.
4. **24/7 access:** the H1 promise.
5. **Guidance:** the app, custom workouts, progress tracking.
6. **Price and value:** recovery amenities included, "Pay Up Front and SAVE BIG".

**The current homepage is a single viewport:**
- H1, "OPEN 24/7…", JOIN NOW / FREE DAY PASS, phone, one photo, social icons, footer.
- The page title is "Join the 300 Club Today", but nothing on the page explains the 300 Club. **Don't use it until the client explains it.**
- Everything persuasive lives on subpages. **The redesign has to bring verbatim subpage copy onto the homepage, or there's nothing for a story to travel through.**

**Brand:**
- Black, white and grays, plus logo red #E82226 (the eagle crest) and #E8355C (the flexing-H ring mark).
- Fonts are Fjalla One (condensed, uppercase) for display and Source Sans Pro for body text.
- Buttons are square-cornered, white with dark text.
- The photos are moody: black ceilings, hex LED lights, red machines.
- **The flexing-arm "H" is the strongest visual asset they own.**

**Notices to preserve:**
- "*Recurring Memberships Will Auto Renew at the Start of Each Month*"
- The guest policy: "NO Guests allowed … during Non-Staffed Hours"
- The reCAPTCHA line on the contact form
- The cookie banner text
- Staffed hours vs 24/7 access

**Open questions for the client:**
- "New Section... Just for Legs! Coming October, 2025" is a year stale.
- "300 Club" is unexplained.

## Inspiration sites: techniques to borrow

### unitedcarriers.com (primary)
*Webflow + Lenis, 32,000 px of page, 26 sticky/fixed elements, six canvases.*
1. **Pinned stage per chapter.** Sticky wrappers (`home-hero-stick`, `home-service-stick first/second/third-screen`, `home-service-new-truck-stick`) sit inside tall sections. Scroll distance becomes scene time while the viewport stays put.
2. **One vehicle carried across chapters.** Crane → truck → ship are canvas scenes (`home-service-crane`, `-truck`, `-mb-crane`). Each is scrubbed by section progress, so the cargo appears to travel continuously.
3. **Live readout tied to scroll velocity.** `home-service-speed` is a speedometer-style number driven by Lenis velocity, which makes scrolling feel like driving.
4. **Preloader that becomes the hero.** A dotted world map with a counter resolves into a WebGL globe with route arcs. The loading state is part of the story.
5. **Atmosphere transitions.** Black space fades through blue into white sky as the story moves from global to local: a full-viewport gradient driven by scroll.

### drone.riotters.com
*Next.js, Three r183 full-screen WebGL canvas, Lenis.*
1. **One 3D object that persists across sections.** The drone sits on a fixed full-screen canvas. Its position, rotation and scale are keyed to section progress, so it glides from centre to the right edge and banks between chapters.
2. **Word-by-word scrub reveal.** Paragraphs start at ~20% opacity and each word fills to full opacity as scroll passes it.
3. **Sticky split layout.** Text scrolls on the left (`lg:sticky lg:top-0 lg:h-screen`) while the object holds on the right.
4. **Section numbering and hairline grid.** Small numbered pills ("3") and 1 px rules give an engineered, instrument-panel feel.

### cerebrium.ai
*Lenis + swup page transitions, fixed WebGPU/Three background canvas.*
1. **Fixed 3D background that reacts to scroll.** Magenta ribbons on a fixed canvas rotate and parallax behind all the content.
2. **Light sheet slides over dark.** A white rounded-top panel scrolls up over the dark hero, a strong chapter break without a hard cut.
3. **Two-tone headlines.** The first line is in ink and the second in the accent colour ("Built for teams, / pushing boundaries").
4. **Infinite logo marquee** under the hero, for credibility at a glance.
5. **Sticky label column.** A small section label sticks on the left while long content scrolls on the right.

### apple.com / AirPods Pro 3
*Apple's AnimSystem (`data-anim-keyframe`, 18 groups), sticky local nav, 16 videos.*
1. **Sticky product nav with a persistent Buy button.** The primary CTA is never more than one glance away. **This is the model for keeping JOIN NOW always visible.**
2. **Scroll-keyed fades and scale-ins.** Headline and media keyframes are bound to element position, not time, so they reverse when scrolling up.
3. **Highlights carousel with autoplay progress pills** and play/pause control (an accessibility-friendly autoplay pattern).
4. **Pinned media while copy changes.** A video holds in place as several captions step through.

## What we'll use
- Sticky pinned stages for every chapter (UC).
- One persistent hero object on a fixed layer, keyed to section progress (UC, drone).
- A scroll-velocity HUD readout (UC); for a gym it becomes reps, sets or heart rate.
- Word-by-word reveal for the mission paragraph (drone).
- A light sheet sliding over dark for the pricing chapter (Cerebrium).
- A sticky header with JOIN NOW always visible (Apple).
- An equipment-brand marquee (Cerebrium); the client has no logo files, so it's set as text in Fjalla One.

Everything is rendered as original SVG/CSS in the client's palette. No visuals or assets are taken from these sites.
