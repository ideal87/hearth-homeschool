# Hearth — touch homeschool calendar

A touch-first family calendar built around homeschooling three young children —
**Kindergarten, Grade 1 and Grade 4**. Designed for a tablet on the kitchen counter.

Four screens are **fully functional**, with all data stored in your browser.
The rest are **static mockups** and say so, with a watermark.

## Run it

Double-click `index.html`. No build step, no dependencies, no server, no account.

If your browser blocks local scripts, serve the folder instead:

```bash
python -m http.server 8777
```

Then open <http://127.0.0.1:8777>.

## What actually works

| Screen | Status | What you can do |
| --- | --- | --- |
| **Routine & chores** | ✅ live | Tick tasks, earn stars, switch morning/midday/evening, move between days, add / edit / delete tasks |
| **Rewards** | ✅ live | Star banks, reward store CRUD, cash in, approve or deny requests |
| **Calendar** | ✅ live | Add / edit / delete events, weekly repeats or one-offs, day / week / month, mark done, push to tomorrow, three-way series delete |
| **Kids** | ✅ live | Add, rename, recolour, remove children; per-child profile and their own login view |
| **Settings** | ✅ mostly | Star values, school days, approval and carry-over rules, theme, tips, export / import / reset |
| Today, Lessons, Progress, Records | 🚧 mockup | Watermarked, controls disabled |

Inside Settings, the **Sync**, **Notifications** and **State requirements** cards are
individually badged `mockup` — everything else on that screen is real.

### Storage

Everything lives in `localStorage` under the key `hearth.db.v2`, on this device only.
Nothing is uploaded. Settings → **Export** gives you a JSON snapshot; **Import**
restores one; **Reset** returns to the sample family.

## Per-child language on the routine board

Each child carries a `lang`. **Their column renders entirely in it** - slot names,
section headings, bonus and celebration text, the day counter, and the toasts fired
when they tick something. A mixed family works: Eli's column can be English while
Maya's is Korean, side by side.

Filter the family bar to a single child and the **whole routine page** follows them -
toolbar, buttons and the date, which is formatted with `toLocaleDateString` in their
locale (`8월 31일 월요일`). Their full-screen **Their view** is always entirely in
their language.

Change it from the globe chip on their column, from Settings → Languages in use, or
in the child editor. Bundled: English, 한국어, Español, Français.

### Translating the task and event names themselves

Titles are your data, so nothing is machine-translated. Instead every routine, chore
and calendar event carries an **optional Korean name**, entered in a second
*"What is it? · 한국어"* field in the task and event editors. When a child's routine
language is 한국어 they see that name; everyone else sees the English one, and leaving
it blank means the English name is used for everybody.

All 20 sample routines and 22 sample events ship with Korean names already filled in,
so switching a child to 한국어 gives a fully Korean board immediately.

The **calendar always shows the English title** - it is a parent screen, and only the
routine board localises. Titles are stored as a `titles` map keyed by language, so
other languages can be added without touching the schema.

Section order on each column is **routine → chores → today's lessons**: the jobs a
child owns come first, and the scheduled lessons sit underneath as context.

## Sound and effects

All audio is synthesised with WebAudio - no files, works offline, nothing to load.

- **Tick**: a soft rising A-C#-E chime with a shimmer partial, plus 9 star particles
  flying off the row you tapped.
- **Untick**: a quieter falling two-note phrase.
- **Slot cleared**: a four-note C-E-G-C fanfare and a burst of confetti.
- **Day cleared**: a longer six-note flourish and twice the confetti.

Toggle either from the speaker button on the routine toolbar or Settings → Sound &
effects, where **Play** previews the celebration. Both are skipped automatically when
the device asks for `prefers-reduced-motion`. The AudioContext is built lazily on the
first tap, which is what browsers require.

## Deleting a repeating calendar event

Tapping delete on a repeat opens a chooser rather than guessing, and tells you how
many occurrences are coming up:

- **Only this day** - adds a single-date exception; the series carries on.
- **This day and everything after** - sets an `until` date, so earlier weeks survive.
- **The whole series** - removes the event and every occurrence.

One-off events skip the chooser and just confirm.

## Two rules the data model enforces

**1. The calendar never holds routines.** Lessons, co-op and appointments are
`events`. Brushing teeth and feeding the dog are `tasks`. They are separate stores,
so the calendar never fills up with "get dressed" — and no title appears in both.

**2. But today's lessons *do* appear on the routine board.** Each child's column
shows the events scheduled for them on that date, as dashed subject-coloured cards,
dropped into the matching part of the day (before noon → morning, before 5pm →
midday, after → evening). Tap one to tick it off. This is the one place the two
systems meet, and it only flows calendar → routine.

## The star economy

- Each task carries its own star value; defaults for new ones are in Settings.
- Clearing a whole slot pays a **bonus** (default 10) on top.
- A bank is `opening balance + everything ever ticked − everything cashed in`,
  recomputed from the ticks on every render. It cannot drift out of sync.
- **Carry over** off means only stars earned since Monday count.
- **Parent approves** on means cashing in creates a request you approve or deny on
  the Rewards screen; denying refunds the stars.

Worked example, live in the app: ticking Eli's six morning tasks pays 40 star-values
plus the 10-star slot bonus, moving his bank 245 → 295. Turn the slot bonus up to 30
in Settings and the same day is instantly worth 70.

## Kid-friendly touches on the routine board

Rounded 32px columns with a soft gradient in each child's colour, a progress ring
that answers "are we nearly done?" without reading, chunky slot buttons showing
`done/total`, 70px task rows where the whole row is the button, a pop animation on
the tick, a celebration panel when a child clears the day, and big emoji throughout.
Minimum tap target is 48px; most are larger. Nothing depends on hover.

**Their view** (Kids → Their view) is the child-facing screen: only their tasks, in
huge rows, with their star total, and an animal picture instead of a password.

## Things worth tapping

- **Routine** → tap any row; finish a slot for the bonus; **Manage** to add a task.
- **Routine** → the dashed cards are today's calendar lessons.
- **Calendar** → **+ Event**, set it to repeat weekly, then find it on the board.
- **Kids** → **Add a child**, then **Manage** on the routine board to give them jobs.
- **Rewards** → cash in, then approve or deny it.
- **Settings** → change the slot bonus and watch every total move.

## Files

```
index.html            markup shell only; everything renders from JS
assets/styles.css     tokens, six child palettes, subject colours, touch sizing, watermark
assets/icons.js       inline SVG icon set
assets/data.js        date helpers, subjects, slots + static data for the mockup screens
assets/i18n.js        the four language dictionaries and the t() helper
assets/fx.js          WebAudio chimes + star/confetti particles
assets/store.js       THE LIVE DATA: seed, localStorage persistence, CRUD, star maths
assets/ui.js          modal / drawer / toast primitives and shared fragments
assets/views.js       the nine screens
assets/modals.js      task, event, kid and reward editors; kid mode; export / import
assets/tour.js        spotlight tour engine + per-screen scripts
assets/app.js         shell, hash router, delegated action handler
```

## Notes for whoever picks this up

- Every control is a `data-action="verb:arg"` attribute handled by one delegated
  switch in `app.js`. Adding a button means adding a `case`.
- All reads and writes go through `store.js`; nothing else touches `localStorage`.
  `saveDB()` runs on every mutation, so there is no save button to forget.
- Star totals are always derived, never stored — see `starsOn`, `starBank`.
- Child and subject colours are CSS custom properties (`--c`, `--cs`, `--cb`) set by
  one class, so recolouring a child is a one-line change.
- Recurring events use `days:[0-6]` (0 = Monday); one-offs use `date:'YYYY-MM-DD'`.
  Deleting a single occurrence of a repeat adds it to `exceptions`.
- Loading the app on a weekend rolls "today" forward to Monday so screens are full.
- Translations live in one flat dictionary per language in `i18n.js`; a missing key
  falls back to English rather than showing the key.
- `FX` is a no-op whenever its setting is off or reduced motion is requested, so
  callers never need to check first.
- Still not built: drag-and-drop, real photo upload, and the four mockup screens.
