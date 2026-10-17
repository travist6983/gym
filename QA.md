# QA: HardWorx Gym homepage concept

Tested 2026-10-17 in Chrome on macOS:
- the Vite dev server (`127.0.0.1:5174`)
- the production build served with `vite preview` (`127.0.0.1:4174`)

The test helpers (`__go`, `__lenis`) only exist when the URL has `?debug=1`.

## Viewports checked

| Width | How | Result |
|---|---|---|
| 1869×873 and 1568×732 | live Chrome window, every chapter at several progress points | Pass |
| 1440×810 | headless Chrome screencast of the full journey (`media/hardworx-journey-desktop.mp4`) | Pass |
| 1024×700 | iframe harness | Pass. FAQ text scrolls inside its pinned stage on short screens, by design. |
| 390×780 / 390×844 | three iframes in Chrome, plus a headless screencast (`media/hardworx-journey-mobile.mp4`) | Pass |
| Reduced motion | `?rm=1`, the same code path as `prefers-reduced-motion: reduce` | Pass. Static stacked sections, all copy, one still illustration per chapter, no Lenis and no sticky pinning. |
| No JS | CSS only applies the story layout under `html.js` | All content renders in normal flow |

## Performance

Lighthouse 12.8.2 against the production build:

| Run | Perf | A11y | Best practices | LCP | FCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile #1 | 99 | 100 | 100 | 1.8 s | 1.4 s | 0.001 | 0 ms |
| Mobile #2 | 99 | 100 | 100 | 1.9 s | 1.4 s | 0.001 | 0 ms |
| Mobile #3 | 98 | 100 | 100 | 2.2 s | 1.4 s | 0.001 | 0 ms |
| Desktop | 100 | 100 | 100 | 0.4 s | 0.4 s | 0.017 | 0 ms |

**Budgets met:**
- LCP is under 2.5 s on Lighthouse's throttled mobile profile.
- CLS is under 0.1.

**Frame rate:** a 24-second linear Lenis scroll through the whole story at 1869×873 rendered 1,836 frames. That's an average of 13.3 ms per frame (75 Hz display). The 99th percentile was 15.3 ms, with 0 frames over 20 ms.

**SEO scores 50 on purpose.** The concept ships `noindex, nofollow` plus a `robots.txt` that blocks crawlers, so it can't be mistaken for the client's live site.

**What fixed the budget along the way:**
- The hero photo stays in its original DOM spot. Moving it with JS had been resetting its paint time.
- A 440w hero image for phones, with preload `imagesrcset`.
- CSS is inlined at build time, and the fonts are subset and preloaded. Fjalla went from 45 KB to 20 KB.
- Logos resized: the header logo went from 72 KB to 6 KB.
- The CSS defaults for `--fh` and `--gap` use the same formula as the JS layout, so the hero copy doesn't move when JS runs.

## Content parity (checked by script against `content.json`)

**Links:** all 23 unique links on the page match `content.json`, with none missing:
- nav and More menu
- account links
- the 4 purchase URLs
- tel and mailto links
- Facebook and Instagram
- Google privacy and terms
- directions

**Copy:** every string in `content.json` appears verbatim on the page, with two known differences:
1. **"Coming October, 2025"** under *New Section... Just for Legs!* is hidden. You approved this, because the date has passed. A comment marks the spot in `index.html`. **Ask the client** whether the legs section is open.
2. **The Facilities paragraph is split** at its sentence boundary. The equipment sentences sit in the workout chapter and the sauna/tanning/cold plunge sentence sits in the recovery chapter. Both halves are verbatim.

**Notices:**
- **Auto-renew:** "*Recurring Memberships Will Auto Renew at the Start of Each Month*" sits directly under the plans. It's full contrast, has a border, and never animates. On mobile it stays visible below the swipe track.
- **Guest policy:** shown as a red-bordered notice with a warning icon, always expanded and never animated.
- **reCAPTCHA line:** kept with the form, including its links.
- **Cookie banner:** verbatim text and buttons, same corner position as today. The concept sets no cookies, so the choice is only remembered locally.

**CTAs:** JOIN NOW and FREE DAY PASS are in the first viewport. JOIN NOW also stays pinned in the header for the whole page.

**Phone and address:** the phone shows in the hero, the FAQ intro, contact and the mobile menu. The address shows in contact.

## Changes made during QA

- **Figure faced the wrong way.** The member was mirrored the whole time, so they looked like they were walking backwards. `render()` treated the facing value as a boolean. Fixed: the member now faces right on floors and left going down ramps, with a turn at each end. The silhouette also got clearer facing cues: a nose/chin profile, longer shoes and a deeper chest.
- **Updates cards blew up** to full image height. Images now use `height: auto` so the 16:7 crop applies.
- **Inline counters showed false numbers mid-count:** "0 members", "0 Tanning Salons", "$0" plans. Every number inside verbatim copy is now static. Only the decorative "500" (`aria-hidden`) counts up.
- **Ramps cluttered the next scene.** Each ramp is masked so it only shows while it's in use.
- **The brand marquee ran behind the tall machines.** It now sits under the paragraph.
- **The glowing hex ceiling washed out the H1.** It now fades with a mask and there's a soft scrim behind the copy.
- **Resizing jumped you forward in the story.** A relayout now keeps you at the same chapter and progress.
- **Memberships (desktop) hid the deadlift.** The layout is more compact now.
- **Memberships (mobile) hid the deadlift.** On mobile the plans became a scroll-driven swipe track instead.
- **The finale logo's black lettering vanished on black.** It now sits on the white badge it has on the live site.
- **Contrast checker false positive.** Lighthouse flagged the Memberships text because the light panel is in another layer. The copy block now has its own matching light background.

## Accessibility

**Structure:**
- One H1. Chapter headings follow the source pages' levels (H2/H3/H4 kept in order).
- All copy is real HTML. The story layers (`#world` SVG and the backdrop) are `aria-hidden`.

**Keyboard and focus:**
- Visible 2 px red focus ring.
- Skip link.
- The More menu works by keyboard and closes on Escape and on focus-out.
- The mobile menu is a button with `aria-expanded`.
- The FAQ uses native `<details>`.

**Form:**
- Labelled fields.
- `Email*` is required with `aria-invalid` feedback, and a `role=status` message.
- It **posts nowhere**: `TODO(endpoint)` in `index.html` and `src/ui.js`.

## Remaining issues / notes for the client conversation

- **"300 Club":** the live page title is "Join the 300 Club Today". It's kept as the `<title>`, but nothing on their site explains it. Ask before featuring it.
- **The form needs a real endpoint** before launch. Also decide whether to keep reCAPTCHA; the notice is kept because the live form uses it.
- **The HUD and app-log readouts are illustrative UI:** the session clock starting at 3:00 AM, and "4 reps", "12:00". They show the member's journey on the page and make no claims about the gym. The station names come from the client's own copy.
- **Equipment brand names are set as text** in the marquee, taken from their Facilities and FAQ copy. No manufacturer logos are used.
- **Very short desktop windows** (under about 700 px tall): long copy (FAQ, Training) scrolls inside its pinned stage. It stays readable, but the heading slides under the header near the end of those chapters.
- **Not tested** on a physical iPhone or Android, or in Safari or Firefox. Lenis, sticky positioning and SVG filters are all supported there, but give it a real-device pass before showing on a phone.
- **The rim-light SVG filter is on for phones too.** Mobile frame rate was measured in headless Chrome only. If a low-end Android stutters, the first lever is turning the filter off on `pointer: coarse`.
