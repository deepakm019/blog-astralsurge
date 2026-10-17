# AstralSurge backlog

Source: external UX review of the homepage, search and empty state, an article,
all three quest entry screens, chapter, quiz and progress flows, at 390px and
desktop widths. Source code, analytics and real-user research were not
available to the reviewer, so architectural points are recommendations, not
diagnoses. Code locations below were checked against `blogger-template.xml`.

## Priority scale

- **P0**: correctness, accessibility regression, or a conflict between two
  places that show the same number. Fix before new work.
- **P1**: blocks the core workflow: discover, read, practise, get feedback,
  resume.
- **P2**: polish, measurement, or structural work to schedule later.

Effort: S = under half a day, M = 1-2 days, L = several days.

Core workflow (from the review): discover a topic, understand why it matters,
read, practise, get feedback, resume later.

## P0

### 1. Streak shown two ways
- The hub and header pill treat a streak as 0 if the last answered day was
  older than yesterday. The quest's own HUD shows the stored value, so a user
  can see "Streak 9" on a quest page and "Streak 0" on the homepage.
- Code: hub and pill logic in the global script (`readQuest`,
  `renderQuestProgress`, around line 8600). Quest HUDs at lines ~3004, ~4526
  and ~7973.
- Fix: one streak rule, applied everywhere. The recommended rule is the
  reviewer's implied one: a streak is live only if the last answered day is
  today or yesterday. Apply it inside each quest's HUD too. This changes quest
  display only, not stored data or XP.
- Effort: S. Decision needed on the rule.

### 2. Quest tabs have no arrow-key navigation
- Tabs use `role="tab"` but respond only to Tab and Enter. The WAI-ARIA tabs
  pattern expects Left/Right to move between tabs, and Home/End to jump to the
  first and last.
- Code: tab bars at the top of each quest section (`nav.tabs` in `#sdq`, and
  the `agx-tabs` bars in `#agx` and `#dbml`).
- Fix: roving `tabindex`, arrow-key handlers, and focus moved to the selected
  tab.
- Effort: M.

### 3. Learning progress has no written definition
- XP, Level, Streak and the header pill all exist, but nothing explains what
  earns XP, how Level is derived, what "complete" means, or how the daily
  question streak works. The header pill sums XP across quests while Level is
  per quest, which is not obvious.
- Fix: one short "How progress works" panel on each Progress tab, linked from
  the hub and the pill's tooltip. Cover: XP sources, Level = every 100 XP,
  per-quest vs combined totals, and streak rules.
- Effort: S.

### 4. Reduced-motion gap in quest cards (fixed in this commit)
- The hub cards I added animated on hover and were missing from the
  reduced-motion rule. Added `.quest-card:hover{transform:none}` to the
  reduced-motion block.
- Effort: done.

## P1

### 5. Discovery beyond "Latest"
- The homepage has the hero, the three quest cards, then a single "Latest"
  feed. A new reader has no route by topic (Java, Python, Agentic AI) or by
  learning goal (interview prep, certification).
- Fix: a "Start here" section with three to four learning paths, each a short
  ordered list. A "Next to read" block at the end of each article, using the
  existing `.related-posts` styles (line ~609), so readers keep moving.
- Effort: M.

### 6. Search empty state
- The default Blogger no-results state is minimal, and the review reports it as
  a dead end. No suggestions, no topic links, no quest links.
- Fix: a custom empty state with the top topics, the three quests, and a
  "Try a shorter search" hint.
- Effort: S.

### 7. Resume where you left off
- Progress is saved per quest, but the site does not say where the reader
  stopped. Returning readers must find their place again.
- Fix: store the last quest, chapter and tab per viewer in localStorage, and
  show a "Continue" link on the hub. Per-viewer convenience only, with a
  try/catch around every read and write.
- Effort: S-M.

### 8. Celebrations interrupt practice
- The quest scripts call `toast()` 16 times, including badge unlocks, and the
  toast auto-hides after 2 seconds. The reviewer found these interruptions
  during reading and practice.
- Fix: keep the celebration but make it non-blocking and quiet: no focus
  change, a longer on-screen time, a visible "Badges" link to review what was
  earned, and a Display setting to reduce it.
- Effort: S.

### 9. Stacked sticky chrome while reading
- On articles, the global header, the `.toolbar` (sticky at `top:66px`), the
  reading progress bar and the Focus and Display controls all compete for the
  top of the screen.
- Fix: merge the toolbar actions into the header on article pages, or drop the
  toolbar's stickiness on narrow widths. Measure on a 390px device before and
  after.
- Effort: M.

## P2

### 10. Accessibility audit across all page types
- Run an automated audit (axe or Lighthouse) on the homepage, an article, each
  quest's entry, chapter, quiz and progress views, in dark and light themes.
  The review found accessibility behaviour that needs correction; this audit
  will list the specifics.
- Effort: S for the audit, M for the fixes it reveals.

### 11. Display panel as a proper disclosure
- The Display panel closes on Escape and outside click, and moves focus to its
  first control. Confirm with a screen reader that its state and label are
  announced clearly, and consider whether it should be a dialog.
- Effort: S.

### 12. Mobile 390px pass
- Header: Focus mode is hidden at 760px and below (it is still available under
  Display → Extras). Confirm this is understood, and check the quest tab bars
  scroll rather than wrap.
- Effort: S.

### 13. Measurement
- There is no analytics in the repo, and the review could not use any. Define
  the few events that would show whether the workflow works: search with zero
  results, quest entry to first answer, daily-question completion, return
  visits within 7 days. Any script must come from an allowed origin and be
  reviewed against the template's security rules.
- Effort: M, plus a decision on tooling.

### 14. Quest structure in the template
- Quest bodies (`HTML6`, `HTML7`, `HTML8`) are inline in the Blogger template,
  several thousand lines each. A generator already exists under
  `skills/quest-page-builder`.
- The review recommends improving the existing components before any rewrite.
  Revisit this only if the P0 and P1 items stall because of template size.
- Effort: L.
