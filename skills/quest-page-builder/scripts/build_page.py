#!/usr/bin/env python3
"""Build a quest-style learning page (tabs, chapters, diagrams, practice, progress).

Usage:
    python3 build_page.py SPEC.json [--template ../../blogger-template.xml]

SPEC.json (see ../examples/agentic-ai.json):
    slug            Blogger page slug, e.g. "agentic-ai-concepts"
    section_id      id of the wrapper div, short and unique, e.g. "agentic"
    widget_id       HTML widget id in the template, e.g. "HTML7"
    store_key       localStorage key, e.g. "agx-v1" (must be unique per page)
    title, kicker, lede
    intro_html      optional extra HTML shown under the lede
    practice_intro_html  optional text above the practice questions
    chapters        list of {id, heading, html}; html is the chapter body (no h2)
    realms          list of {id, name, sections: [chapter ids], boss: {name, q, o, a, ex}}
    questions       list of {id, realm, q, o, a, ex}

Writes pages/<slug>.html next to the repo root. With --template it also replaces
the content of the widget with that id in the Blogger template (the widget must
already exist; see SKILL.md for adding a new page block).
"""
import argparse
import json
import pathlib
import re
import sys
import xml.dom.minidom

SKILL = pathlib.Path(__file__).resolve().parent.parent
ROOT = SKILL.parent.parent
CSS = (SKILL / "assets" / "style.css").read_text(encoding="utf-8")
RUNTIME = (SKILL / "assets" / "runtime.js").read_text(encoding="utf-8")
TITLES = ["Apprentice", "Builder", "Architect", "Systems Sage", "Principal", "Staff Legend"]
DEFAULT_PRACTICE = """<h2 id="{sid}-practice-h">Practice and scoring</h2>
<p>Test yourself as you read. Each section you mark as read earns XP, each quiz question you answer correctly earns XP, and a realm is cleared when you have read all of its sections and answered all of its questions correctly. Each realm ends with a boss question worth the most XP. Progress is saved in this browser only.</p>
<table>
<thead><tr><th>Action</th><th>XP</th></tr></thead>
<tbody>
<tr><td>Mark a section as read (once per section)</td><td>+10</td></tr>
<tr><td>First correct answer to a quiz question</td><td>+20</td></tr>
<tr><td>First wrong attempt at a question</td><td>+4</td></tr>
<tr><td>Answer today's daily question</td><td>+25, plus +15 if correct</td></tr>
<tr><td>Clear a realm (all its sections and questions)</td><td>+50</td></tr>
<tr><td>Defeat a realm boss</td><td>+150</td></tr>
</tbody>
</table>
<p class="agx-note">Every 100 XP raises your level and changes your title. A streak counts consecutive days on which you answer the daily question.</p>"""


def fail(msg):
    print("ERROR:", msg, file=sys.stderr)
    sys.exit(1)


def validate(spec):
    for key in ("slug", "section_id", "widget_id", "store_key", "title", "chapters", "realms", "questions"):
        if key not in spec:
            fail(f"spec is missing '{key}'")
    if not re.fullmatch(r"[a-z0-9-]+", spec["slug"]):
        fail("slug must be lowercase letters, digits and dashes")
    chapter_ids = [c["id"] for c in spec["chapters"]]
    if len(set(chapter_ids)) != len(chapter_ids):
        fail("chapter ids must be unique")
    realm_ids = [r["id"] for r in spec["realms"]]
    for r in spec["realms"]:
        for sid in r["sections"]:
            if sid not in chapter_ids:
                fail(f"realm '{r['id']}' lists unknown chapter '{sid}'")
        b = r["boss"]
        if not (0 <= b["a"] < len(b["o"])):
            fail(f"boss '{b['name']}' answer index out of range")
    for q in spec["questions"]:
        if q["realm"] not in realm_ids:
            fail(f"question '{q['id']}' has unknown realm '{q['realm']}'")
        if not (0 <= q["a"] < len(q["o"])):
            fail(f"question '{q['id']}' answer index out of range")
    for c in spec["chapters"]:
        if "]]>" in c["html"]:
            fail(f"chapter '{c['id']}' contains ']]>' which breaks the template CDATA block")
    for key in ("intro_html", "practice_intro_html"):
        if "]]>" in spec.get(key, ""):
            fail(f"'{key}' contains ']]>'")
    if "</script" in json.dumps(spec).lower():
        fail("spec text must not contain '</script'")


def data_block(spec):
    rs = spec["realms"]
    realms = [{"id": r["id"], "name": r["name"], "sections": r["sections"], "boss": r["boss"]} for r in rs]
    return (
        f"  var KEY = {json.dumps(spec['store_key'])};\n"
        "  var R = {concept:10, correct:20, wrong:4, daily:25, dailyCorrect:15, realm:50, boss:150};\n"
        f"  var TITLES = {json.dumps(TITLES)};\n"
        f"  var REALMS = {json.dumps(realms, ensure_ascii=False, indent=1)};\n"
        f"  var QS = {json.dumps(spec['questions'], ensure_ascii=False, indent=1)};\n"
    )


def build_html(spec):
    sid = spec["section_id"]
    chapters = []
    for n, c in enumerate(spec["chapters"], 1):
        chapters.append(f'<h2 id="{c["id"]}">{n}. {c["heading"]}</h2>\n{c["html"]}\n')
    body = "\n".join(chapters)
    practice_intro = spec.get("practice_intro_html") or DEFAULT_PRACTICE.format(sid=sid)
    tabs = (
        '<nav class="agx-tabs" role="tablist" aria-label="Sections">'
        '<button role="tab" data-tab="read" aria-selected="true">Read</button>'
        '<button role="tab" data-tab="chapters" aria-selected="false">Chapters</button>'
        '<button role="tab" data-tab="diagrams" aria-selected="false">Diagrams</button>'
        '<button role="tab" data-tab="practice" aria-selected="false">Practice</button>'
        '<button role="tab" data-tab="progress" aria-selected="false">Progress</button>'
        "</nav>"
    )
    header = (
        f'<p class="kicker">{spec.get("kicker", "")}</p>\n'
        f'<h1>{spec["title"]}</h1>\n'
        f'<p class="lede">{spec.get("lede", "")}</p>\n'
        f'{spec.get("intro_html", "")}\n'
    )
    script_body = "(function(){\n" + data_block(spec) + RUNTIME.replace("/*__DATA__*/\n", "")
    script_body = script_body.replace("document.getElementById('agx')", f"document.getElementById('{sid}')")
    return (
        f"<style>\n{CSS}\n</style>\n"
        f'<div id="{sid}">\n{header}{tabs}\n'
        f'<section id="agx-p-read" class="agx-panel"><div id="agx-reader"></div><div id="agx-pager" class="agx-pager"></div></section>\n'
        f'<section id="agx-p-chapters" class="agx-panel" hidden><div id="agx-chapters" class="agx-cols"></div></section>\n'
        f'<section id="agx-p-diagrams" class="agx-panel" hidden><div id="agx-diagrams" class="agx-cols agx-cols-wide"></div></section>\n'
        f'<section id="agx-p-practice" class="agx-panel" hidden>{practice_intro}<div id="agx-practice"></div></section>\n'
        f'<section id="agx-p-progress" class="agx-panel" hidden><div id="agx-progress"></div></section>\n'
        f'<div id="agx-body" hidden>\n{body}</div>\n'
        f"<script>\n{script_body}</script>\n</div>\n"
    )


def embed(template, widget_id, html):
    text = template.read_text(encoding="utf-8")
    marker = f"<b:widget id='{widget_id}'"
    if marker not in text:
        fail(f"widget '{widget_id}' not found in {template.name}; add the page block first (see SKILL.md)")
    i = text.index(marker)
    open_tag = "<b:widget-setting name='content'><![CDATA["
    a = text.index(open_tag, i) + len(open_tag)
    b = text.index("]]></b:widget-setting>", a)
    new = text[:a] + html + text[b:]
    xml.dom.minidom.parseString(new.encode("utf-8"))
    template.write_text(new, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--template", help="Blogger template to update in place")
    args = ap.parse_args()
    spec = json.loads(pathlib.Path(args.spec).read_text(encoding="utf-8"))
    validate(spec)
    html = build_html(spec)
    out = ROOT / "pages" / f"{spec['slug']}.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({len(html)} bytes)")
    if args.template:
        embed(pathlib.Path(args.template), spec["widget_id"], html)
        print(f"updated widget {spec['widget_id']} in {pathlib.Path(args.template).name}")


if __name__ == "__main__":
    main()
