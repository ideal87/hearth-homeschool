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
| **Rewards** | ✅ live | Star banks, the team pot, personal and family reward CRUD, cash in, approve or deny requests |
| **Calendar** | ✅ live | Add / edit / delete events, weekly repeats or one-offs, day / week / month, mark done, push to tomorrow, three-way series delete |
| **Kids** | ✅ live | Add, rename, recolour, remove children; per-child profile and their own login view |
| **Settings** | ✅ mostly | Star values, school days, approval and carry-over rules, theme, tips, export / import / reset |
| Today, Lessons, Progress, Records | 🚧 mockup | Watermarked, controls disabled |

Inside Settings, the **Sync**, **Notifications** and **State requirements** cards are
individually badged `mockup` — everything else on that screen is real.

### Storage and sync

**Live app: https://homeschool-7b68e.firebaseapp.com** — use this address (the
`.web.app` one forwards here, because Google sign-in on iPad needs the page and
the sign-in handler on the same domain).

- **Signed in:** the family's data lives in Google Firestore (`us-west1`) and
  syncs to every signed-in device within a second or two. A copy stays on the
  device, so the board works offline and catches up when it reconnects.
- **Signed out, or on any other address** (GitHub Pages, a double-clicked
  `index.html`): everything stays in this browser's `localStorage`, exactly as
  before. The ☁️ button offers **Move to cloud**, which opens the Firebase address
  and carries this device's data across in the link.

Theme, sound, effects and the hidden-menu setting are **per device** and never
sync, so the kitchen iPad can differ from a laptop.

Only the Google accounts listed in `firestore.rules` can read or write. That file
is git-ignored so the addresses stay out of this public repo; copy
`firestore.rules.example` to start one. The web `apiKey` in `assets/cloud.js` is
public by design — sign-in plus the rules are what protect the data.

Firestore layout: `families/main` holds kids, tasks, events, rewards,
redemptions, exceptions and settings; ticks and the closed-day star ledger live in
`families/main/days/YYYY-MM` so no document ever approaches the 1 MiB limit. Every change is pushed as
individual field updates, so two devices editing different things never
overwrite each other.

Deploy with `firebase deploy` (Hosting + Firestore rules). Settings → **Export**
still gives you a JSON snapshot.

## Per-child language on the routine board

Each child carries a `lang`. **Their column renders entirely in it** - slot names,
section headings, celebration text, the star and day counters, and the toasts fired
when they tick something. A mixed family works: Hannah's column can be English while
Ian's is Korean, side by side.

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

**Two purses.** A **routine** pays the child who ticks it. A **chore** pays the
family: every one of its stars goes to the team pot and none to the child's own
bank. The chore rows on the board wear a teal 🤝 pill instead of a gold ⭐ one, and
the chore heading says *to the team*, so which purse is being filled is never a
guess. Flip a task between routine and chore in the task editor and its stars
change purse with it, past ticks included.

- Each task carries a star value **per child** (`starsByKid`), set with the −/+
  rows in the task editor, so an older child can earn more for the same job. New
  tasks start from the defaults in Settings. Tasks saved before this fall back to
  their single `stars` value.
- A bank is `opening balance + every routine ever earned − everything cashed in`,
  recomputed on every render, so it cannot drift out of sync.
- The foot of each column shows the child's own stars **against the most possible**
  today and this week (Monday to Sunday), counting only the routines scheduled on
  each day.
- The **team pot**, the gold bar at the top of the board, is `every chore star ever
  ticked − what the family has cashed in`, with today and this week shown against
  the most the chores could pay. Opening balances are personal, so they never
  reach it.
- **Carry over** off means only stars earned since Monday count, for the pot as
  well as for each child.
- **Parent approves** on means cashing in creates a request you approve or deny on
  the Rewards screen; denying refunds the stars.

### Closing the books

Stars used to be worked out from the ticks every single time they were shown, so
renaming a task, repricing it or deleting it quietly rewrote history. They are now
**banked**: after `settings.sealAfterDays` days (default 2) a day is **closed**. What
each child earned that day is written down once in `DB.ledger`, and that day's
individual ticks are dropped.

- A closed day cannot move again. Change a task from 5 stars to 300, delete it, or
  delete every task you have - last week's totals stay exactly as they were.
- Today and the two days behind it stay live, so a forgotten tick can still be added
  and a mistake can still be undone.
- On the board a closed day shows what happened - stars earned, stars given to the
  team, how many jobs were done - instead of rows nobody can change.
- It is also how the data stays small: one row per child per day instead of one key
  per tick. A month of a three-child family shrinks from about 21 KB of ticks to
  about 5 KB, and it is the same saving in Firestore.
- Set it to 0 in Settings to switch closing off entirely and keep every tick for ever.

A ledger row is `[ownStars, teamStars, done, total, maxOwn, maxTeam]`, keyed
`childId|YYYY-MM-DD`, so it shards by month exactly like the ticks do. Days close on
load, when cloud data arrives, at midnight, and before any edit to a task or a child -
an edit can never reach back past the window. A day is only written once, so two
devices closing the same day agree.

### Rewards

The store has two shelves. **Personal rewards** are bought with a child's own
stars. **Family rewards** come out of the team pot - a museum field trip, eating
out, a STEM day, a service afternoon, a camp-out - and are added from *Team pot →
Add*, or by switching any reward to *The whole family* in its editor. A reward can
only be paid for from the purse it belongs to.

**One reward a month, each.** `settings.rewardsPerMonth` (default 1) caps how many
rewards one child may cash in per calendar month; the team pot has an allowance of
its own, the same size. The bank cards, the spend drawer and the cash-in dialog all
show what is left, and 0 means no limit. A denied request does not count against it.

Reward prices were doubled (movie night 120 up to a sleepover at 1000). Saved data
is upgraded once on load, flagged with `settings.rewardCostsDoubled`, so prices
never double twice. The family rewards are added to saved data the same way, behind
`settings.teamRewardsAdded`, and skip any name you already use.

Worked example: Reading Time is a routine worth 10 for Hannah, 4 for Juan and 3 for
Ian, so ticking it moves three banks. Set the table is a chore worth 5 - whoever
ticks it, the pot gains 5 and no bank moves at all.

## Kid-friendly touches on the routine board

Rounded columns lit with a wash of each child's colour, a progress ring that answers
"are we nearly done?" without reading, chunky slot buttons showing `done/total`, 70px
task rows where the whole row is the button, a spring on every press, a celebration
panel when a child clears the day, and big emoji throughout. Minimum tap target is
48px; most are larger. Nothing depends on hover.

The look: **Nunito** (the system rounded face takes over if the web font cannot load),
a soft colour wash behind the app, hairline borders with layered shadows instead of
heavy outlines, gradient accents on the things you press most, and a frosted top bar.
Colours are declared once as custom properties, in three palettes - light, system dark
and forced dark - so the whole app re-themes from a handful of lines. `color-mix()` is
only ever an enhancement; each use has a plain fallback for older iPads.

**Their view** (Kids → Their view) is the child-facing screen: only their tasks, in
huge rows, with their star total, and an animal picture instead of a password.

## Things worth tapping

- **Routine** → tap a routine, then a chore, and watch which total moves.
- **Routine** → **Manage** → edit a task and give each child a different star value.
- **Routine** → the dashed cards are today's calendar lessons.
- **Calendar** → **+ Event**, set it to repeat weekly, then find it on the board.
- **Kids** → **Add a child**, then **Manage** on the routine board to give them jobs.
- **Rewards** → cash in, then approve or deny it.
- **Rewards** → **Team pot** → spend the chore stars on a day out together.
- **Settings** → change the default star values that new tasks start from.

## Files

```
index.html            markup shell only; everything renders from JS
assets/styles.css     tokens, six child palettes, subject colours, touch sizing, watermark
assets/icons.js       inline SVG icon set
assets/data.js        date helpers, subjects, slots + static data for the mockup screens
assets/i18n.js        the four language dictionaries and the t() helper
assets/fx.js          WebAudio chimes + star/confetti particles
assets/sync-core.js   pure diff / Firestore document mapping (no Firebase imports)
assets/cloud.js       Firebase module: Google sign-in, live Firestore sync
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
- Star totals for **open** days are derived from the ticks (`starsFor`, `starsOn`,
  `maxStarsOn`, `starsInWeek`, `teamStars`, `teamBank`, `starBank`); **closed** days
  come from `DB.ledger` instead - see `sealOldDays`, `sealDay`, `isClosedDate`. Each
  public function falls back to the live figure when a day has no row, so a read that
  happens before the books are closed is still correct.
- Chores are told apart by `isTeamTask`, and the team spends under `TEAM_ID` ('team').
- `store.js` runs `sealOldDays()` as it loads, below where the function is declared -
  keep any constant it uses inside the function, because a `var` further down the file
  is still `undefined` at that moment.
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
