# Blogger setup

This guide installs the theme and creates the static pages.

## 1. Back up the current theme

1. Open **Theme** in Blogger.
2. Click **Edit HTML**, then **Backup / Restore**, and download the backup.

## 2. Upload the template

1. In **Edit HTML**, click **Edit HTML** and clear the editor.
2. Paste the contents of `blogger-template.xml`, or use **Backup / Restore → Upload** with the file.
3. Click **Save**. If Blogger reports an error, restore the backup and check the file with `scripts/check_template.py`.

## 3. Configure the navigation

The navigation and topic links are widgets in the layout. Edit them in **Layout** if your category labels differ from the defaults (`java`, `Python`, `fundamentals`).

## 4. Create the static pages

Create each page under **Pages → New page**. The URL slug must match exactly.

| Title | Permalink | Notes |
| --- | --- | --- |
| System Design Quest | `system-design-quest` | Shows the interactive quest. No body text is needed. |
| Agentic AI concepts | `agentic-ai-concepts` | Shows the field guide. No body text is needed. |
| Databricks Machine Learning Associate quest | `databricks-ml-associate-quest` | Shows the exam quest. No body text is needed. |

Leave the page body empty. The template renders the content from its own widget.

## 5. Add pages to the sidebar (optional)

1. In **Layout**, open the **Pages** widget in the sidebar.
2. Select the pages to list.

## 6. Preview before publishing

Use **Preview** in Blogger for both pages and check:

- The page loads without the sidebar and shows the full-width layout.
- Diagrams render in both dark and light themes.
- Comments appear below the content.

## Troubleshooting

- **A static page shows the wrong content or the sidebar.** Check that the permalink matches the slug above exactly.
- **The System Design Quest appears on the Agentic AI page.** The template excludes this page with the condition `!(data:view.url contains "agentic-ai-concepts")`. Check that the slug was not changed.
- **Blogger rejects the template.** Run `python3 scripts/check_template.py` for the exact XML error.
