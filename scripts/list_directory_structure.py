#!/usr/bin/env python3
"""
Utility script to provide a trimmed repository tree.

Usage:
    python3 scripts/list_directory_structure.py --max-depth 2

Features:
- Limits traversal depth (default 2 levels)
- Skips noisy directories (node_modules, .git, dist, caches)
- Optional --exclude flags for extra folders

This keeps Step 1 reproducible without overwhelming output.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable, Set

DEFAULT_EXCLUDES = {
    ".git",
    ".idea",
    ".vscode",
    ".cache",
    ".vite",
    "__pycache__",
    "node_modules",
    "dist",
    "tmp",
}


def iter_entries(path: Path) -> Iterable[Path]:
    """Yield directory entries sorted with folders first for stable output."""
    try:
        entries = sorted(
            path.iterdir(),
            key=lambda p: (p.is_file(), p.name.lower()),
        )
    except PermissionError:
        return []

    for entry in entries:
        yield entry


def print_tree(path: Path, max_depth: int, excludes: Set[str], depth: int = 0) -> None:
    """Recursively print the directory structure."""
    if depth > max_depth:
        return

    indent = "  " * depth
    label = "." if depth == 0 else path.name
    suffix = "/" if path.is_dir() else ""
    print(f"{indent}{label}{suffix}")

    if not path.is_dir() or depth == max_depth:
        return

    for entry in iter_entries(path):
        if entry.name in excludes:
            continue
        print_tree(entry, max_depth, excludes, depth + 1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Print trimmed directory structure.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path("."),
        help="Root directory to inspect (default: current directory).",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=2,
        help="Maximum recursion depth (default: 2).",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Additional directory names to exclude (can be repeated).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    excludes = DEFAULT_EXCLUDES.union(args.exclude)
    root = args.root.resolve()

    if not root.exists():
        raise FileNotFoundError(f"Root {root} does not exist")

    print_tree(root, args.max_depth, excludes)


if __name__ == "__main__":
    main()
