#!/usr/bin/env python3
# Copyright (c) 2021-Present Datalayer, Inc.
#
# MIT License

"""Bump the version of the npm packages this repository releases.

Four packages, one version: `@datalayer/jupyter-react`, `jupyter-lexical`,
`jupyter-embed` and `jupyter-docusaurus-plugin` are released together, and
the release workflow checks that the tag names the version each one carries.
`packages/react/package.json` is the source of truth; the other three
`version` fields are copies, and so is every `^<version>` floor the
repository's own package.json files (packages, examples, docs, storybook)
put on these four packages — a floor left behind makes `npm install` reach
for the previous release instead of the workspace.

    python dev/bump_version.py patch     # 2.0.18 -> 2.0.19
    python dev/bump_version.py minor     # 2.0.18 -> 2.1.0
    python dev/bump_version.py major     # 2.0.18 -> 3.0.0
    python dev/bump_version.py           # asks
    python dev/bump_version.py patch --dry-run

The two Python packages (`jupyter-react`, `jupyter-lexical` on PyPI) have
versions of their own in `jupyter_react/__version__.py` and
`jupyter_lexical/__version__.py`; `--python` bumps those by the same part.

Nothing is written unless **every** file can be updated. Either all of them
move or none do.

@module dev.bump_version
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NPM_PACKAGES = ("react", "lexical", "embed", "docusaurus-plugin")
NPM_NAMES = tuple(f"@datalayer/jupyter-{package}" for package in NPM_PACKAGES)
#: The file the version is read *from*.
SOURCE = ROOT / "packages" / "react" / "package.json"

PYTHON_SOURCES = (
    ROOT / "packages" / "react" / "jupyter_react" / "__version__.py",
    ROOT / "packages" / "lexical" / "jupyter_lexical" / "__version__.py",
)

PARTS = ("major", "minor", "patch")


class Unbumpable(Exception):
    """A file this script cannot update, named with what it expected.

    Raised before anything is written.
    """


def read_version() -> str:
    version = json.loads(SOURCE.read_text()).get("version")
    if not version:
        raise Unbumpable(f"{SOURCE.relative_to(ROOT)} has no version")
    return str(version)


def bump(version: str, part: str) -> str:
    """The next version, or a refusal naming what it could not read."""
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", version)
    if match is None:
        raise Unbumpable(
            f"{version!r} is not major.minor.patch; bump it by hand and say "
            "here what the next one should be"
        )
    major, minor, patch = (int(value) for value in match.groups())
    if part == "major":
        return f"{major + 1}.0.0"
    if part == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def _replace_once(path: Path, pattern: str, replacement: str, current: str) -> str:
    """One substitution, refusing zero and refusing more than one."""
    text = path.read_text()
    found = re.findall(pattern, text, flags=re.M)
    if len(found) != 1:
        raise Unbumpable(
            f"{path.relative_to(ROOT)}: expected exactly one "
            f"{current!r} matching {pattern!r}, found {len(found)}"
        )
    return re.sub(pattern, replacement, text, count=1, flags=re.M)


def tracked_package_files() -> list[Path]:
    """Every package.json git knows about, node_modules excluded by construction."""
    out = subprocess.run(
        ["git", "ls-files", "*package.json", "**/package.json"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return sorted({ROOT / line for line in out.splitlines() if line.strip()})


def planned_edits(current: str, new: str) -> dict[Path, str]:
    """Every file's new content, or an exception. Nothing is written here."""
    escaped = re.escape(current)
    edits: dict[Path, str] = {}

    version_field = rf'(^\s*"version"\s*:\s*")({escaped})(")'
    for package in NPM_PACKAGES:
        path = ROOT / "packages" / package / "package.json"
        edits[path] = _replace_once(path, version_field, rf"\g<1>{new}\g<3>", current)

    # The floors the repository puts on its own packages: `"^current"` (or
    # `"current"`) on any of the four names, in any tracked package.json.
    names = "|".join(re.escape(name) for name in NPM_NAMES)
    floor = re.compile(rf'("(?:{names})"\s*:\s*"\^?)({escaped})(")')
    for path in tracked_package_files():
        text = edits.get(path) or path.read_text()
        replaced, count = floor.subn(rf"\g<1>{new}\g<3>", text)
        if count:
            edits[path] = replaced
    return edits


def planned_python_edits(part: str) -> dict[Path, str]:
    """The Python packages' own versions, each bumped by `part`."""
    edits: dict[Path, str] = {}
    for path in PYTHON_SOURCES:
        text = path.read_text()
        match = re.search(r"""__version__\s*=\s*['"]([^'"]+)['"]""", text)
        if match is None:
            raise Unbumpable(f"{path.relative_to(ROOT)} has no __version__")
        current = match.group(1)
        new = bump(current, part)
        edits[path] = _replace_once(
            path,
            rf"""(__version__\s*=\s*['"])({re.escape(current)})(['"])""",
            rf"\g<1>{new}\g<3>",
            current,
        )
        print(f"python {path.relative_to(ROOT)}: {current} -> {new}")
    return edits


def check_json(edits: dict[Path, str]) -> None:
    for path, text in edits.items():
        if path.suffix == ".json":
            try:
                json.loads(text)
            except ValueError as error:
                raise Unbumpable(f"{path.relative_to(ROOT)} would not parse: {error}")


def ask() -> str:
    current = read_version()
    print(f"Current version: {current}")
    for index, part in enumerate(PARTS, start=1):
        print(f"  {index}) {part:5s} -> {bump(current, part)}")
    while True:
        answer = input("Which? [major/minor/patch] ").strip().lower()
        if answer in PARTS:
            return answer
        if answer in ("1", "2", "3"):
            return PARTS[int(answer) - 1]
        print(f"Say one of: {', '.join(PARTS)}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("part", nargs="?", choices=PARTS, help="what to bump")
    parser.add_argument(
        "--python", action="store_true", help="also bump the two Python packages' versions"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="say what would change and write nothing"
    )
    arguments = parser.parse_args(argv)

    try:
        current = read_version()
        part = arguments.part or ask()
        new = bump(current, part)
        edits = planned_edits(current, new)
        if arguments.python:
            edits.update(planned_python_edits(part))
        check_json(edits)
    except Unbumpable as error:
        print(f"Refused: {error}", file=sys.stderr)
        print("Nothing was written.", file=sys.stderr)
        return 1

    for path, text in sorted(edits.items()):
        if not arguments.dry_run:
            path.write_text(text)
        print(f"{'would bump' if arguments.dry_run else 'bumped'} {path.relative_to(ROOT)}")
    print(f"{current} -> {new}")
    if not arguments.dry_run:
        print(f"Next: commit on a branch, open the pull request; after merge, tag v{new}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
