#!/usr/bin/env python3
"""
Safe React.FC → function transformer for PanelFlow (v8).

Patterns handled:
  A) const X: React.FC<Props> = ({ ... }) => ( <JSX on same line/> );
  B) const X: React.FC<Props> = ({ ... }) => {   (block with brace on same line)
  C) const X: React.FC<Props> = ({ ... }) =>
      {   (block with brace on NEXT line)
  D) const X: React.FC<Props> = ({ ... }) => (
        <JSX multiline/>
      );
     (multi-line JSX with closing ) on its own line)
  E) interface type alias: Button: React.FC<Props>;
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path("/home/ubuntu/workspace/PanelFlow/src")

# A) Same-line JSX arrow: "=> ( <JSX/> );" — entire body on same line as =>
PAT_A = re.compile(
    r'^(\s*)(?:export\s+)?const\s+(\w+):\s*React\.FC<([^>]+)>\s*=\s*\(\{([^}]*)\}\)\s*=>\s*'
    r'(\([^;{}]*\))\s*;?\s*$',
)

# B) Block arrow with brace on SAME line: "=> {"
PAT_B = re.compile(
    r'^(\s*)(?:export\s+)?const\s+(\w+):\s*React\.FC<([^>]+)>\s*=\s*\(\{([^}]*)\}\)\s*=>\s*\{',
)

# C) Block arrow with brace on NEXT line: line ends with "=>", next line is just "{"
#   Matches the "=>" line only
PAT_C = re.compile(
    r'^(\s*)(?:export\s+)?const\s+(\w+):\s*React\.FC<([^>]+)>\s*=\s*\(\{([^}]*)\}\)\s*=>\s*$',
)

# D) Multi-line JSX arrow: line ends with "=> (" — body starts on next line, ) is closer
#   L15: export const X: React.FC<Props> = ({ children }) => (
#   L16:   <>{children}</>
#   L17: );
PAT_D = re.compile(
    r'^(\s*)(?:export\s+)?const\s+(\w+):\s*React\.FC<([^>]+)>\s*=\s*\(\{([^}]*)\}\)\s*=>\s*\(\s*$',
)

# E) Interface type alias
PAT_TYPE = re.compile(r'^(\s*)(\w+):\s*React\.FC<([^>]+)>;(.*)$')


def is_top_level(indent: str) -> bool:
    return indent == "" or indent in ("\t", "  ")


def process_file(path: Path) -> dict:
    text = path.read_text()
    lines = text.splitlines()
    new_lines = []
    n_a = 0
    n_b = 0
    n_c = 0
    n_d = 0
    n_type = 0
    b_stack = []  # stack of function names that need } closing

    i = 0
    while i < len(lines):
        line = lines[i]

        # A) Same-line JSX
        ma = PAT_A.match(line)
        if ma and is_top_level(ma.group(1)):
            _, name, props, params, body = ma.groups()
            fn_name = name[6:] if name.startswith('const ') else name
            new_lines.append(f'{indent}function {fn_name}({{ {params.strip()} }}: {props}) {{ return {body}; }}')
            n_a += 1
            i += 1
            continue

        # D) Multi-line JSX: line ends with "=> (", body spans multiple lines, ");" closes
        md = PAT_D.match(line)
        if md and is_top_level(md.group(1)):
            indent, name, props, params = md.groups()
            fn_name = name[6:] if name.startswith('const ') else name
            new_lines.append(f'{indent}function {fn_name}({{ {params.strip()} }}: {props}) {{')
            b_stack.append(fn_name)
            n_d += 1
            i += 1
            continue

        # B) Block arrow with brace on same line
        mb = PAT_B.match(line)
        if mb and is_top_level(mb.group(1)):
            indent, name, props, params = mb.groups()
            fn_name = name[6:] if name.startswith('const ') else name
            new_lines.append(f'{indent}function {fn_name}({{ {params.strip()} }}: {props}) {{')
            b_stack.append(fn_name)
            n_b += 1
            i += 1
            continue

        # C) Block arrow with brace on NEXT line
        mc = PAT_C.match(line)
        if mc and is_top_level(mc.group(1)):
            indent, name, props, params = mc.groups()
            fn_name = name[6:] if name.startswith('const ') else name
            # Check if next line is just '{'
            if i + 1 < len(lines) and lines[i + 1].strip() == '{':
                new_lines.append(f'{indent}function {fn_name}({{ {params.strip()} }}: {props}) =>')
                b_stack.append(fn_name)
                n_c += 1
                i += 1
                continue

        # "};": closing brace — only for our stack top
        if line.rstrip() == '};' and b_stack:
            new_lines.append('}')
            b_stack.pop()
            i += 1
            continue

        # E) Interface type alias
        mtype = PAT_TYPE.match(line)
        if mtype and is_top_level(mtype.group(1)):
            indent, name, props, rest = mtype.groups()
            new_lines.append(f'{indent}{name}: (props: {props}) => JSX.Element;{rest}')
            n_type += 1
            i += 1
            continue

        new_lines.append(line)
        i += 1

    result = '\n'.join(new_lines)
    changed = n_a or n_b or n_c or n_d or n_type
    if changed:
        path.write_text(result)
        print(f"  ✓ {path.relative_to(ROOT)}  (A={n_a}, B={n_b}, C={n_c}, D={n_d}, type={n_type})")
    return {'a': n_a, 'b': n_b, 'c': n_c, 'd': n_d, 'type': n_type}


def main():
    targets = [
        "components/ui/accordion.tsx",
        "components/ui/confirm-dialog.tsx",
        "components/ui/card.tsx",
        "components/ui/option.tsx",
        "components/ui/radio-group.tsx",
        "components/ui/list.tsx",
        "components/ui/space.tsx",
        "components/ui/timeline.tsx",
        "components/ui/modal.tsx",
        "shared/components/layout/AppLayout/AppLayout.tsx",
        "shared/components/pipeline/GenerationResult.tsx",
        "pages/SettingsPage.tsx",
    ]

    print("Safe React.FC → function transformation v8 (A/B/C/D patterns)")
    print("=" * 62)
    totals = {'a': 0, 'b': 0, 'c': 0, 'd': 0, 'type': 0}
    changed_files = []
    for rel in targets:
        path = ROOT / rel
        if not path.exists():
            continue
        r = process_file(path)
        if r['a'] or r['b'] or r['c'] or r['d'] or r['type']:
            changed_files.append(rel)
            for k in totals:
                totals[k] += r[k]

    print(f"\n{len(changed_files)} files changed: A={totals['a']}, B={totals['b']}, C={totals['c']}, D={totals['d']}, type={totals['type']}")
    if not changed_files:
        print("Nothing to do.")
        return

    print("\nRunning tsc --noEmit...")
    r = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(ROOT), capture_output=True, text=True)
    errors = [l for l in r.stdout.splitlines() if "error TS" in l]
    if errors:
        print(f"✗ TSC errors ({len(errors)}):")
        for e in errors[:15]:
            print(f"  {e}")
        print("\nReverting...")
        subprocess.run(["git", "checkout", "--", "."], cwd=str(ROOT))
        sys.exit(1)
    else:
        print("  ✓ tsc --noEmit passed")
        print("\nRun `git diff --stat` to review, then commit.")


if __name__ == "__main__":
    main()