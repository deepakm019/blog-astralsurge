#!/usr/bin/env python3
"""Validate the Blogger template and the page sources before committing.

Checks:
  * blogger-template.xml is well-formed XML.
  * Every embedded page in pages/ can be placed inside a CDATA block
    (it must not contain the CDATA terminator "]]>").
  * Every page in pages/ has a matching static-page section in the template.

Exit status is 0 when everything passes, 1 otherwise.
"""
import pathlib
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "blogger-template.xml"
PAGES_DIR = ROOT / "pages"


def main() -> int:
    errors = []

    try:
        ET.parse(TEMPLATE)
        print(f"ok   {TEMPLATE.name} is well-formed XML")
        template_text = TEMPLATE.read_text(encoding="utf-8")
    except ET.ParseError as exc:
        errors.append(f"{TEMPLATE.name}: XML error: {exc}")
        template_text = ""

    for page in sorted(PAGES_DIR.glob("*.html")):
        content = page.read_text(encoding="utf-8")
        before = len(errors)
        if "]]>" in content:
            errors.append(f"{page.name}: contains ']]>', which would break the CDATA block")
        section_id = page.stem.replace("agentic-ai-concepts", "agentic")
        if template_text and f"id='{section_id}'" not in template_text:
            errors.append(f"{page.name}: no section with id '{section_id}' in the template")
        if len(errors) == before:
            print(f"ok   {page.name} can be embedded")

    for err in errors:
        print(f"FAIL {err}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
