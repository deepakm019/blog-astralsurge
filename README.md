# AstralSurge Blogger Template

The custom Blogger theme and static pages behind [astralsurge.com](https://www.astralsurge.com): a dark-first engineering journal with light and dark themes, reading controls, and an interactive System Design Quest.

## Contents

| Path | What it is |
| --- | --- |
| `blogger-template.xml` | The full Blogger theme. Upload this in Blogger's theme editor. |
| `pages/agentic-ai-concepts.html` | Source for the Agentic AI field guide. Its content is embedded in the template. |
| `docs/blogger-setup.md` | Step-by-step guide to installing the theme and creating the pages. |
| `scripts/check_template.py` | Checks that the template is well-formed XML and that embedded pages are safe to embed. |

## Quick start

1. Clone the repo and run the checks:

   ```bash
   git clone https://github.com/deepakm019/blog-astralsurge.git
   cd blog-astralsurge
   python3 scripts/check_template.py
   ```

2. In Blogger, go to **Theme → Edit HTML → Backup/Restore** to save your current theme, then upload `blogger-template.xml`.
3. Create the static pages listed in [`docs/blogger-setup.md`](docs/blogger-setup.md).

## Pages

| Page | Blogger slug | Source |
| --- | --- | --- |
| System Design Quest | `system-design-quest` | Embedded in the template |
| Agentic AI concepts | `agentic-ai-concepts` | `pages/agentic-ai-concepts.html` |

Static pages get a full-width layout with no sidebar. The template picks which page to render by its URL slug, so the slugs above must match exactly.

## Editing

- **Theme changes:** edit `blogger-template.xml`. Keep the CSS in the `<b:skin>` block and the scripts at the end of the file.
- **Page content:** edit the HTML in `pages/` and copy the change into the matching `<b:widget-setting name='content'>` block in the template. The check script warns if a page's content contains `]]>`, which would break the CDATA block.
- Run `python3 scripts/check_template.py` before every commit.

## Contributing

1. Create a branch from `main`.
2. Make your change and run the check script.
3. Open a pull request describing what changed and how you previewed it in Blogger.

## Licence

All rights reserved. Copyright (c) 2026 deepakm019. No reuse, modification or redistribution is permitted without prior written permission. See [`LICENSE`](LICENSE).
