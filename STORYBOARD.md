# Storyboard: "One Session" (Journey A)

**Locked choices:**
- One member figure in a black silhouette with a brand-red (#E82226) rim light.
- The body change is strength only: shoulders, arms and posture fill out.
- JOIN NOW sits in the hero and stays pinned in the header all the way down.

## How it works

**The route:**
- A single SVG path, "the lane", snakes down the whole story.
- It runs along each chapter's floor, then turns down to the next floor.
- The figure follows it with GSAP MotionPathPlugin, and the lane draws behind it as a glowing red trail.

**Pinned chapters:** each chapter is a tall section holding a sticky, viewport-height stage.

**The camera and scrolling:**
- The lane, the equipment and the figure all sit on one fixed overlay layer.
- While a chapter is pinned, that layer holds still and the figure performs.
- Between chapters, it pans at exactly the speed the page scrolls, so the equipment looks attached to the page.
- Scroll is smoothed with Lenis, which drives ScrollTrigger.

**The figure:**
- About 14 hand-tuned key poses on a jointed SVG figure.
- Poses blend smoothly as you scroll, and a strength value from 0 to 1 widens the shoulders, arms, chest and thighs.
- The red rim light is one SVG filter applied to the whole silhouette.

**The HUD** sits in a small bottom-left panel, in the style of United Carriers:
- a clock that starts at 3:00 AM and ticks forward through the session (the 24/7 nod)
- the current station name
- a set/rep counter
- a session progress bar

**Copy:** all of it is verbatim from `content.json`. The Facilities paragraph is split at a sentence boundary: the equipment sentences go with the workout, and the sauna / tanning / cold plunge sentence goes with recovery.

## Chapters

Scroll is measured in vh, so 100vh is one screen of scrolling.

| # | Scroll range (vh) | What the figure does | Text on screen (verbatim) | Technique | Reduced-motion fallback | Mobile (390 px) |
|---|---|---|---|---|---|---|
| 0 | always | (sticky header) | Eagle logo, the 7 nav links, a More menu with 3 purchase links, search, cart and account icons, and **JOIN NOW** | The header shrinks after the hero. JOIN NOW is a white square button. | Same | Logo, JOIN NOW and a menu button that opens a full-screen menu |
| 1 Hero | 0–180 | The figure walks in from the left in the dark and taps the key fob at the door. Their hex-ceiling photo powers up from dim to full, panel by panel. The figure walks through. | **HardWorx Gym** (H1), OPEN 24/7 FOR HARDWORX GYM MEMBERS, **JOIN NOW**, **FREE DAY PASS**, CONTACT US: (586) 262-4772 | The CTAs are visible on load before any motion. The photo brightens through a CSS filter scrubbed by scroll, and the hex lights flicker in. The HUD clock shows 03:00 AM. | Lights fully on, figure standing at the open door | Text in the top 58% of the screen, figure and floor below, same CTAs |
| 2 Mission | 180–380 | Walks straight onto an empty machine without slowing. The floor stays uncrowded while a counter climbs to **500**. | *Our Vision / Mission* paragraph | Word-by-word reveal like the drone site. "Time is Money" and "no longer waiting for equipment" stay lit. The 500 counter is scrubbed. | Full paragraph, 500 shown | Paragraph above, counter as a large number |
| 3 Facilities | 380–880 | Four stations, left to right: **treadmill** run, **pin-stack lat pulldown** (the weight stack rises as you scroll), **plate-loaded chest press** (red lever arms with plates), **dumbbell shoulder press**. Strength goes 0.1 to 0.4. | *Facilities* paragraph, first two sentences. The phrase for the current station lights up: Cardio Machines, Pin-Stack, Plate Loaded, Free Weights. Below it, a marquee of the brands from their copy (Arsenal, Atlantis, PowerLift, Hammer Strength, Cybex, Panatta, True Fitness, Muscle D) | Phrase highlight like Cerebrium's list. Each machine's moving parts are tied to the figure's pose. The HUD rep counter ticks. | 4 stations shown as a static row with the figure on the dumbbells | One station at a time: machines slide in under a figure that stays centred |
| 4 Training | 880–1140 | Sits on a bench, pulls out a phone, and logs a set. The phone UI pops out to card size and rows tick in: exercise, weight, reps. | *Workout Plans & Programs* paragraph, plus their trainer-spotting photo (`bench-spot.webp`) | HTML phone card in front of the figure. Rows fill as you scroll. | Phone card showing every row | Phone card full width, figure smaller |
| 5 Recovery | 1140–1380 | **Infrared sauna**: sits inside a red glow. Then steps into the **cold plunge**: frost spreads and breath steams. | "We also have Infrared Saunas, Two Tanning Salons, and Cold Plunge All Included in the Membership Price!", with **2** counted for the tanning salons | A red radial glow, then a white frost mask. All in brand neutrals, no new colours. | Both shown side by side | Sauna, then plunge, stacked |
| 6 Updates | 1380–1660 | **Merch rack**: grabs a tee, and from here the silhouette wears the tee with the H mark on the chest. **Legs sign**: one squat (strength 0.6). | *New Merchandise!* / Swing In and Grab Your Merch!; *New Section... Just for Legs!* (date handling per your answer); *Family-Friendly Environment* + paragraph. Their sign photos used as cards. | The cards slide in as the figure passes. The costume swap is one class change on the figure. | 3 cards, figure in the tee | Cards stack vertically and the figure stays at the bottom |
| 7 Reviews | 1660–1860 | Walks past three review cards on the wall. Each card's 5 stars fill as the figure passes it. | Mindi 10/1/2025, Jeff 9/25/2025, Steve 9/23/2025: full verbatim text with names and dates | Stars fill with scroll. Cards lift in with a slight 3D tilt. | 3 cards with full stars | Swipeable row of cards with scroll-snap |
| 8 Memberships | 1860–2160 | A light panel slides up over the dark page. On the panel's floor the figure does a **barbell deadlift** (strength 0.8). | *Recurring Memberships*, Come In Today to Sign Up!; $79 plan and its 3 features; *Paid In Full (PIF) Memberships*, Pay Up Front and SAVE BIG; $850 and $150 plans; each plan links to its purchase URL. **Notice: *Recurring Memberships Will Auto Renew at the Start of Each Month*** | Light sheet over dark like Cerebrium. Prices count up from $0 with scroll. The notice is static, full contrast, directly under the plans, and never faded or moved. | 3 plan cards and the notice | Stacked plan cards, notice directly below |
| 9 FAQ | 2160–2400 | **Locker room**: opens a locker, then shower steam rises. | *Frequently Asked Questions* intro (phone and email); 4 questions and answers as an accordion, open by default on desktop. Counters: **6** private restrooms, **3** showers. The **guest policy** answer is styled as a bordered notice. | Counters scrubbed. The guest notice is static. | All answers open | Accordion with the first item open, notice always expanded |
| 10 Finale | 2400–2580 | Walks to centre and hits a **double-biceps flex** (strength 1.0). The flexing arm lines up with the arm in their H mark, the silhouette dissolves into `logo-h-circle.png` with a red rim flash, and the lane trail ends in the H. | *Contact Us*, **Better yet, see us in person!**, Schedule an appointment or stop in any time during staffed hours and check out our brand new facility today! | Pose blends, then a mask reveal of the logo PNG. The HUD clock stops (around 04:10 AM). | Static H mark beside the heading | Same, scaled |
| 11 Contact | normal flow | (figure parked as the logo) | HardWorx Gym, the address, Get directions, the phone line ("Reach us by phone during staffed hours:" 586-262-4772), the email line, Staffed Hours Mon–Sun table, and the **Questions? Send Us A Message!** form (Name, Email*, Message, Send, Cancel) with the reCAPTCHA notice and links | Plain, readable layout. The form posts nowhere and has a `// TODO: endpoint` comment. | Same | Single column |
| 12 Footer | normal flow | — | Facebook, Instagram, Copyright © 2023 HardWorx - All Rights Reserved., and the 3 purchase links | — | Same | Same |
| — | first visit | — | Cookie notice, verbatim, bottom-right, Decline / Accept (if kept) | Same size and position as today | Same | Bottom sheet |

## Numbers counted with scroll

- 24/7 (hero clock)
- 500 (membership cap)
- 2 (tanning salons)
- $79, $850, $150 (plans)
- 12 Month, 1 Month
- 6 restrooms, 3 showers
- 5 stars on each review

## Performance and accessibility

**Performance:**
- The likely LCP element is the hero H1 or photo (65 KB WebP, preloaded).
- Fonts are self-hosted woff2 (Fjalla One, Source Sans 3) with `font-display: swap`.
- Images below the hero are lazy-loaded. Each sticky stage reserves its height up front, so layout doesn't shift.
- Only transforms and opacity animate. The rim-light filter is turned off on phones.

**Accessibility:**
- One H1. Headings follow the original levels.
- All text is real HTML, and the figure layer is `aria-hidden`.
- Visible focus rings, and the More menu and accordion work by keyboard.
- Light text on black passes WCAG AA.

## As built (2026-10-17)

These changes were made during QA. Full detail is in QA.md.
- **Static numbers in copy.** Numbers inside verbatim copy no longer count: $79 / $850 / $150, "Two Tanning Salons", "6 private restrooms and 3 showers", and the 500 inside the mission paragraph. Mid-count values ("$0", "0 members") read as false claims in a screenshot. The decorative "500 members" figure still counts up.
- **Pricing on mobile** is a scroll-driven swipe track. The auto-renew notice stays visible underneath.
- **Ramps only show while in use.** The lane is still one continuous SVG path; each ramp segment is masked outside its own transition.
