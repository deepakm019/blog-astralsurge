---
name: quest-page-builder
description: Create a quest-style learning page for the AstralSurge blog — a tabbed app (Read, Chapters, Diagrams, Practice, Progress) with numbered chapters, inline SVG diagrams, quiz questions, realm bosses, XP, streaks and badges, like the System Design Quest and the Agentic AI page. Use when the user asks for a new learning page, course, quest, field guide or study page for the blog, or wants pages like the System Design Quest or the Agentic AI page.
---

# Quest page builder

Builds a self-contained quest page for the Blogger template in this repo. Each page has the same parts:

- **Read**: one chapter at a time, with Previous/Next and a "Mark as read" button on realm chapters.
- **Chapters**: a card grid, one per chapter, showing read status.
- **Diagrams**: every inline SVG diagram in one grid, labelled by chapter.
- **Practice**: a daily question, then realms with quiz questions and a boss per realm.
- **Progress**: level, XP, streak, stats, badges and reset.

Scoring follows the System Design Quest: +10 per section read, +20 first correct answer, +4 first wrong attempt, +25 daily (+15 correct), +50 realm clear, +150 boss. Progress is kept in `localStorage` under a per-page key.

## Files

| Path | Purpose |
| --- | --- |
| `assets/style.css` | Shared styles, scoped to `#<section_id>` |
| `assets/runtime.js` | Shared tabs, chapters, scoring and rendering. Data is injected at build time. |
| `scripts/build_page.py` | Builds `pages/<slug>.html` from a JSON spec and can update the template |
| `examples/agentic-ai.json` | Working spec, generated from the existing Agentic AI page |

## Workflow

1. **Plan the content.** Decide the chapters (one per topic, 6–12 is a good range), the realms (4 is typical, each grouping 1–3 chapters), and 3 quiz questions per realm plus one boss question. Quiz questions need four options, one correct answer, and a one-line explanation.
2. **Write the spec.** Copy `examples/agentic-ai.json` and change it. Keys:
   - `slug`: Blogger page slug, lowercase with dashes, e.g. `ai-agents-quest`.
   - `section_id`: short unique id for the wrapper, e.g. `agents`.
   - `widget_id`: HTML widget id in the template, e.g. `HTML8`. Use a new one per page.
   - `store_key`: localStorage key, e.g. `agents-v1`. Must differ per page.
   - `title`, `kicker`, `lede`, optional `intro_html`.
   - `chapters`: list of `{id, heading, html}`. `id` must be unique and match the realm `sections`. `heading` has no number; numbers are added. `html` is the body, with no `<h2>`.
   - `realms`: list of `{id, name, sections, boss: {name, q, o, a, ex}}`.
   - `questions`: list of `{id, realm, q, o, a, ex}`. `a` is the index of the correct option.
   - optional `practice_intro_html`: replaces the default XP text.
3. **Write the chapter content.**
   - Use `<p>`, `<ul>`, `<table>`, `<pre><code>` and `<div class="card">` / `<div class="tip">` / `<div class="warn">`.
   - Escape `<` and `>` inside code (`&lt;`, `&gt;`). Use "and" rather than `&`.
   - Diagrams are `<div class="figure"><svg viewBox="0 0 680 H" role="img" aria-label="...">…</svg><figcaption>…</figcaption></div>`. Use the classes `sv-box`, `sv-hot` (accent), `sv-end`, `sv-zone`, `sv-line`, `sv-dash`, `sv-ah` (arrowhead, used with a `<marker>`), `sv-t`, `sv-s`, `sv-onhot`, and `sv-tc` for centred text. Colours come from theme variables, so diagrams work in dark and light mode. Keep every label inside its box.
   - Never write `]]>` anywhere in the content. The builder rejects it.
4. **Build.** From the repo root:
   ```bash
   python3 skills/quest-page-builder/scripts/build_page.py path/to/spec.json
   ```
   This writes `pages/<slug>.html`. To also update the template, add `--template blogger-template.xml`. The widget must already exist in the template (see step 5).
5. **Add the page block to the template (new pages only).** Insert a block like the Agentic AI one before `</main>`:
   ```xml
   <b:if cond='data:blog.pageType == &quot;static_page&quot; and data:view.url contains &quot;<slug>&quot;'>
     <b:section class='<section_id>' id='<section_id>' maxwidgets='1' name='<Title>' showaddelement='no'>
       <b:widget id='<widget_id>' locked='false' title='' type='HTML' version='2' visible='true'>
         <b:widget-settings>
           <b:widget-setting name='content'><![CDATA[<placeholder>]]></b:widget-setting>
         </b:widget-settings>
         <b:includable id='main'><b:include name='widget-title'/><div class='widget-content'><data:content/></div></b:includable>
         <b:includable id='widget-title'><b:if cond='data:title'><h2 class='title'><data:title/></h2></b:if></b:includable>
       </b:widget>
     </b:section>
   </b:if>
   ```
   Then re-run the builder with `--template`.
6. **Exclude the new page from the System Design Quest.** The quest section's `b:if` must not render on the new page. Add `and !(data:view.url contains &quot;<slug>&quot;)` to its condition. If the quest section is ever removed, skip this.
7. **Fix the comments placement.** The template's comment-moving script looks up `getElementById('quest') || getElementById('agentic')`. Add `|| getElementById('<section_id>')` to that line so comments sit below the new page.
8. **Validate and check.**
   ```bash
   python3 scripts/check_template.py
   ```
   Then check the page in Blogger's preview. Check the Read tab, Previous/Next, Diagrams (all diagrams should appear), Practice answers and Progress.
9. **Commit and push.** Commit with the standard trailers used in this repo:
   ```
   Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01Uwy96RDixQFXGgTzRdsgSB
   ```

## Rules of thumb

- Keep chapters short enough to read in one sitting, and give each one a diagram where the concept has structure.
- Every realm question must be answerable from its own realm's chapters.
- Add a `tip` or `warn` box for the one thing people get wrong, rather than many small caveats.
- Use accurate, current facts. For fast-moving topics, check the source before writing.
- Keep the copyright rules in mind when summarising a source: paraphrase, and cite the source in a "Further reading" list.
