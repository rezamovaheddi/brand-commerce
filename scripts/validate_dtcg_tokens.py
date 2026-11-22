#!/usr/bin/env python3
"""Validate the project's starter token file against selected DTCG 2025.10 constraints."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "tokens" / "brand.tokens.json"

errors = []
try:
    data = json.loads(FILE.read_text(encoding='utf-8'))
except Exception as exc:
    print(f'DTCG TOKEN VALIDATION FAILED: {exc}')
    sys.exit(1)

if data.get('$schema') != 'https://www.designtokens.org/schemas/2025.10/format.json':
    errors.append('expected DTCG 2025.10 format schema URI')

tokens = {}

def walk(node, path='', inherited_type=None):
    if not isinstance(node, dict): return
    current_type = node.get('$type', inherited_type)
    if '$value' in node:
        tokens[path] = (current_type, node['$value'])
        return
    for key, value in node.items():
        if key.startswith('$'): continue
        if any(c in key for c in '.{}'):
            errors.append(f"invalid token/group name at {path or '<root>'}: {key}")
        p = f'{path}.{key}' if path else key
        if isinstance(value, dict):
            walk(value, p, current_type)

walk(data)
if not tokens: errors.append('no tokens found')

for path, (typ, value) in tokens.items():
    if not typ:
        errors.append(f'{path}: missing $type')
        continue
    if isinstance(value, str) and value.startswith('{') and value.endswith('}'):
        target = value[1:-1]
        if target not in tokens:
            errors.append(f'{path}: unresolved alias {value}')
        continue
    if typ == 'color':
        if not isinstance(value, dict):
            errors.append(f'{path}: color must be object or alias')
            continue
        if value.get('colorSpace') != 'srgb':
            errors.append(f'{path}: expected srgb colorSpace')
        comp = value.get('components')
        if not isinstance(comp, list) or len(comp) != 3 or any(not isinstance(x, (int, float)) or x < 0 or x > 1 for x in comp):
            errors.append(f'{path}: invalid sRGB components')
        if 'alpha' in value and (not isinstance(value['alpha'], (int, float)) or not 0 <= value['alpha'] <= 1):
            errors.append(f'{path}: invalid alpha')
    elif typ == 'dimension':
        if not isinstance(value, dict) or not isinstance(value.get('value'), (int, float)) or value.get('unit') not in ('px', 'rem'):
            errors.append(f'{path}: invalid dimension; expected numeric value and px/rem unit')
    elif typ == 'fontFamily':
        if not (isinstance(value, str) or (isinstance(value, list) and value and all(isinstance(x, str) for x in value))):
            errors.append(f'{path}: invalid fontFamily')
    elif typ == 'fontWeight':
        if not isinstance(value, (int, float)) or not 1 <= value <= 1000:
            errors.append(f'{path}: invalid fontWeight')
    elif typ == 'number':
        if not isinstance(value, (int, float)):
            errors.append(f'{path}: invalid number')
    elif typ == 'duration':
        if not isinstance(value, dict) or not isinstance(value.get('value'), (int, float)) or value.get('unit') not in ('ms', 's'):
            errors.append(f'{path}: invalid duration')
    elif typ == 'cubicBezier':
        if not isinstance(value, list) or len(value) != 4 or any(not isinstance(x, (int, float)) for x in value) or not (0 <= value[0] <= 1 and 0 <= value[2] <= 1):
            errors.append(f'{path}: invalid cubicBezier')
    else:
        errors.append(f'{path}: unsupported/unreviewed token type {typ}')

if errors:
    print('DTCG TOKEN VALIDATION FAILED')
    for e in errors:
        print(' - ' + e)
    sys.exit(1)

print(f'DTCG TOKEN VALIDATION PASSED: {len(tokens)} tokens; DTCG 2025.10 selected types and aliases checked.')
