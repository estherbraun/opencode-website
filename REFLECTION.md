# Reflection

Notes from building the half-marathon training hub. Everything below describes
what actually happened in this session. Where something was not done, it says so.

## Model / provider

Cat Jam Free, a free model served through the OpenCode provider, running in
OpenCode Desktop on macOS.

One thing worth recording: no Node, Deno, or Bun was available on this machine.
JavaScript syntax checking and a headless behaviour test of `script.js` were
done with the system JavaScriptCore shell (`jsc`), found at
`/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`.
That only became clear after assuming `node --check` would work and it did not.

## One useful prompt

My shortened build prompt for `index.html`:

> Create AGENTS.md with these rules: plain index.html, style.css, script.js
> only; no frameworks or CDNs; served with `python3 -m http.server 8000
> --bind 127.0.0.1`; works from 360px to desktop with no horizontal scroll;
> real `<button>` controls with visible `:focus-visible`; 16px+ text; no
> placeholder text; no keys or credentials.
>
> Then create index.html for a half-marathon training hub. Title: "First Half:
> A Half-Marathon Training Hub". Short intro for first-time runners, with
> "Check with a doctor before starting any new training plan." A "Training Plan"
> section with 8 workout cards (2 each of data-type easy, long, speed, rest):
> Easy Run 3 mi, Recovery Jog 2 mi, Long Run 6 mi, Long Run 10 mi, Intervals
> 6x400m, Tempo Run 4 mi, Rest Day, Cross-Train 30 min, each with a one-line
> tip. Filter buttons above: All, Easy, Long Run, Speed, Rest, plus an
> aria-live element for the count. A "Gear & Fuel Tips" section with 5 short
> tips (shoes, pre-run snack, gels on long runs, nothing new on race day, lay
> out kit the night before). Footer: "Made for a class project. Not medical
> advice." Link style.css and script.js.

Why it worked: naming the exact copy, the exact section order, the exact
button labels, and the exact constraint list meant the build was deterministic
rather than interpretive. There was no guessing about what "an intro" should
say or how many cards to produce, so no invented placeholder text crept in,
which was itself one of the constraints. The accessibility requirements were
concrete and checkable — real `<button>` elements, a named `aria-live` element,
a visible `:focus-visible` — so they could be verified line by line rather than
eyeballed.

It also paid off later. Because the contract said "an aria-live element for the
count" and "filter buttons above," reviewing the result was a checklist, not an
opinion.

One honest wrinkle: the shortened prompt silently changed the `data-type`
values. The first version asked for `Easy`, `Long Run`, `Speed`, `Rest`; the
shortened one asked for `easy`, `long`, `speed`, `rest`. Reconciling that meant
editing eight cards and five buttons in `index.html` after they had already
been written as title-case. A prompt that restates a contract should either
keep it identical or flag the change.

## One observed tool action

To check that `.gitignore` actually worked rather than just looking correct, I
ran:

```
$ for p in .env node_modules/foo .DS_Store; do
    printf '%-20s ' "$p"; git check-ignore -v "$p" || echo "NOT IGNORED"
  done
```

It came back:

```
.env                 .gitignore:1:..env          .env
node_modules/foo     .gitignore:2:node_modules/   node_modules/foo
.DS_Store            .gitignore:3:.DS_Store        .DS_Store
```

`git check-ignore -v` prints the exact `.gitignore` line number and source
pattern that matched, so this confirms all three rules are live and that
`node_modules/` is matching as a directory rule rather than a literal filename
match. Reading the three-line file would only have shown what was *written*;
this showed what git actually *does*. It also caught nothing, which is itself
worth recording — three of three rules matched on the first try.

## Issue checked before and after a change

Tracked in `fix-notes.txt` during the work; that file has now been folded into
this section and deleted, so this is the surviving record.

**The issue.** At a 375px viewport, `main`'s 1rem padding leaves a 343px content
box. The five filter buttons need roughly 370px of text and padding plus four
gaps, about 402px in total, so the bar wraps to two rows: All, Easy, Long Run,
Speed on row one, Rest on row two. Flex `gap` applies to both axes, so the
vertical gutter between those rows was also 8px. The focus ring is a 3px outline
with a 2px offset, painted 5px outside the border box, which left only about
3px between the focused button's ring and the button above it.

**Before the change** this was established by reading the cascade and doing hand
box arithmetic. It was **not** established by rendering the page. The browser
tool rejects `file://` URLs, and the instruction for that task was not to start
a server, so no rendered measurement was possible. Every number was written
into `fix-notes.txt` so it could be re-derived independently.

**The change.** One line in `style.css` — `.filters` `gap` from `0.5rem` to
`0.75rem`. Twelve-pixel gutter minus 5px of ring bleed leaves 7px of clear
space instead of 3px. `index.html` and `script.js` were not touched.

**After the change**, three things were confirmed:

1. Statically: `grep` confirms `gap: 0.75rem` at line 81 of `style.css`, and
   `index.html` (87 lines) and `script.js` (54 lines) are unchanged.
2. `script.js` still parses cleanly under `jsc` (`PARSE_OK`), and the filter
   behaviour was re-run against a DOM stub earlier in the session, producing
   the expected 8/2/2/2/2 counts with exactly one `aria-pressed="true"` at a
   time.
3. In a real browser, by the person who built the site rather than by me. On
   2026-10-15 the site was served with
   `python3 -m http.server 8000 --bind 127.0.0.1`, Chrome DevTools' device
   toolbar was set to 375px wide, and the filter buttons were tabbed through
   with the keyboard. Three things were observed, and all three matched what
   the arithmetic predicted:

   - The filter bar does wrap to two rows at 375px, as calculated.
   - The focus ring no longer touches the adjacent button as Tab moves
     between the two rows. This is the specific claim that had been
     unverified, and it held.
   - Pressing Enter on "Speed" showed only the two speed cards and the status
     line read "Showing 2 workouts".

   So the fix is confirmed by observation, not just by arithmetic. The
   keyboard-only path — Tab to reach the buttons, Enter to activate — also
   works end to end with no script changes, which is what the native
   `<button>` choice was supposed to buy.

**Worth keeping in mind:** the 7px clearance is a prediction from box
arithmetic that the browser check happened to confirm, not a measurement taken
at the CSS pixel level. A screenshot would be stronger evidence than a
pass/fail observation, and if the gutter ever needs to change again the real
constraint is the 5px of ring bleed, not the button padding.

## How the interaction works

Each filter button carries a `data-filter` value — `all`, `easy`, `long`,
`speed`, or `rest` — and each workout card carries a matching `data-type`, so
filtering is just a string comparison between the two. Clicking a button runs
one function that walks the cached list of cards and sets `hidden = true` on
every card whose `data-type` does not match, which both removes the card from
the page and drops it out of the accessibility tree and tab order. The same
function counts the cards it kept and writes "Showing X workouts" into a
paragraph marked `aria-live="polite"`, so a screen reader announces the new
count politely without interrupting whatever it is currently saying.

State lives on the `aria-pressed` attribute rather than a CSS class: the
pressed button is the only one set to `"true"`, and the stylesheet highlights
that same attribute. Visual state and announced state therefore cannot drift
apart, which they could if the highlight were driven by a separate class.
Because the controls are native `<button>` elements, Tab moves between them and
Enter or Space activates them with no keydown handling in the script at all —
the keyboard support is the platform default, not something hand-rolled. The
one thing the stylesheet does add is a 3px `:focus-visible` outline, so the
focused control is obvious without painting a ring on every mouse click. That
claim was exercised rather than assumed: tabbing to "Speed" and pressing Enter
at 375px left only the two speed cards on the page and read "Showing 2
workouts" in the status line.